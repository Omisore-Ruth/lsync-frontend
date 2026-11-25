"use client";

import { Mic, MicOff, Minus, Pause, Play, Send, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { isPublicPath } from "@/lib/lily/paths";
import { CHIPS, FALLBACK, GO_VERB, matchIntent, WAKE_REPLIES, welcomeText } from "@/lib/lily/knowledge";
import { LilyVoice, pickVoice, ttsSupported, voiceLabel, type VoiceState } from "@/lib/lily/voice";
import { recognitionSupported, WakeListener, type WakeState } from "@/lib/lily/wake";

type Msg = { id: number; from: "lily" | "you"; text: string; href?: string; hrefLabel?: string };

const WELCOMED_KEY = "lily-welcomed";
const SOUND_KEY = "lily-sound";

/** Lily lives on the public pages (landing, blog, sign in and sign up), not inside the signed-in app. */

const noopSubscribe = () => () => {};

const store = {
  get(k: string, session = false) {
    try {
      return (session ? sessionStorage : localStorage).getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string, session = false) {
    try {
      (session ? sessionStorage : localStorage).setItem(k, v);
    } catch {
      /* storage can be blocked; Lily just forgets next time */
    }
  },
};

function Orb({ speaking, listening, size = 44 }: { speaking: boolean; listening: boolean; size?: number }) {
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} aria-hidden>
      {(speaking || listening) && <span className="lily-ring absolute inset-0 rounded-full bg-primary-soft/60" />}
      <span className="relative grid size-full place-items-center overflow-hidden rounded-full shadow-lg" style={{ background: "linear-gradient(135deg,#510eac,#b4399f 58%,#fcaf7b)" }}>
        {speaking ? (
          <span className="flex h-1/2 items-end gap-[3px]">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="lily-bar block w-[3px] rounded-full bg-white" style={{ "--i": i, height: "100%" } as React.CSSProperties} />
            ))}
          </span>
        ) : (
          <span className="font-bold text-white" style={{ fontSize: size * 0.45 }}>
            L
          </span>
        )}
      </span>
    </span>
  );
}

export function LilyAgent() {
  const pathname = usePathname();
  const router = useRouter();
  const visible = isPublicPath(pathname);

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [vstate, setVstate] = useState<VoiceState>("idle");
  const [soundOn, setSoundOn] = useState(true);
  const [mic, setMic] = useState<WakeState>("off");
  const canListen = useSyncExternalStore(noopSubscribe, recognitionSupported, () => false);
  const canSpeak = useSyncExternalStore(noopSubscribe, ttsSupported, () => false);
  const [voiceName, setVoiceName] = useState<string | null>(null);
  const [armed, setArmed] = useState(false); // the welcome is waiting for the first tap or key press
  const [draft, setDraft] = useState("");
  const [compact, setCompact] = useState(false); // the small welcome card, until the person engages

  const rootRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const voice = useRef<LilyVoice | null>(null);
  const wake = useRef<WakeListener | null>(null);
  const soundRef = useRef(true);
  const nextId = useRef(1);
  const welcomeText_ = useRef("");
  const welcomeStarted = useRef(false);
  const touched = useRef(false); // the person has interacted with Lily, so she must not tuck herself away
  const compactRef = useRef(false);
  const lastIntent = useRef<string | null>(null); // so "tell me more" continues the last answer
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
    compactRef.current = compact;
  });

  const push = useCallback((m: Omit<Msg, "id">) => setMsgs((list) => [...list.slice(-11), { ...m, id: nextId.current++ }]), []);

  /** Lily says (and shows) something. Starts speaking synchronously so it works inside a click. */
  const say = useCallback(
    async (text: string, opts: { id?: string; log?: boolean; href?: string; hrefLabel?: string } = {}) => {
      if (opts.log !== false) push({ from: "lily", text, href: opts.href, hrefLabel: opts.hrefLabel });
      const v = voice.current;
      if (!v || !soundRef.current || !ttsSupported()) return;
      wake.current?.suspend(); // never listen while she talks, or she would hear her own "Hey Lily"
      await v.speak(text, opts.id);
      if (!v.busy) wake.current?.resume();
    },
    [push],
  );

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q) return;
      push({ from: "you", text: q });
      const intent = matchIntent(q, lastIntent.current);
      if (!intent) {
        lastIntent.current = null;
        return void say(FALLBACK);
      }
      lastIntent.current = intent.id.endsWith("-more") ? intent.id.slice(0, -5) : intent.id;
      if (intent.stop) {
        voice.current?.stop();
        push({ from: "lily", text: intent.answer });
        wake.current?.resume();
        return;
      }
      if (intent.href && GO_VERB.test(q)) routerRef.current.push(intent.href);
      await say(intent.answer, { id: intent.id, href: intent.href, hrefLabel: intent.hrefLabel });
    },
    [push, say],
  );

  // The wake listener is created once, so it reaches the latest say/ask through refs.
  const sayRef = useRef(say);
  const askRef = useRef(ask);
  useEffect(() => {
    sayRef.current = say;
    askRef.current = ask;
  }, [say, ask]);

  // Set up the voice and the "Hey Lily" listener once.
  useEffect(() => {
    const v = new LilyVoice();
    v.onState = setVstate;
    voice.current = v;
    const refreshVoice = () => {
      v.voice = pickVoice();
      setVoiceName(voiceLabel(v.voice));
    };
    // Saved sound choice and the voice name are read just after mount (they live in the browser, not on the server).
    const init = window.setTimeout(() => {
      const savedOff = store.get(SOUND_KEY) === "off";
      soundRef.current = !savedOff;
      setSoundOn(!savedOff);
      if (ttsSupported()) refreshVoice();
    }, 0);
    if (ttsSupported()) speechSynthesis.addEventListener("voiceschanged", refreshVoice);

    // Optional studio recordings: list them in /lily/manifest.json, e.g. { "welcome": "/lily/welcome.mp3" }.
    fetch("/lily/manifest.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then((m) => v.setAudioMap(m && typeof m === "object" ? (m as Record<string, string>) : {}))
      .catch(() => {});

    const w = new WakeListener({
      onWake: () => {
        const n = Math.floor(Math.random() * WAKE_REPLIES.length);
        void sayRef.current(WAKE_REPLIES[n], { id: `wake-${n + 1}` });
      },
      onQuestion: (q) => {
        setOpen(true);
        void askRef.current(q);
      },
      onState: setMic,
    });
    wake.current = w;

    return () => {
      window.clearTimeout(init);
      if (ttsSupported()) speechSynthesis.removeEventListener("voiceschanged", refreshVoice);
      v.stop();
      w.stop();
    };
  }, []);

  // Leaving the public pages closes her panel (adjusted during render), then silences her and switches the microphone off.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (!visible) {
      setOpen(false);
      setArmed(false);
    }
  }
  useEffect(() => {
    if (visible) return;
    voice.current?.stop();
    wake.current?.stop();
  }, [visible]);

  // Open from "Ask Lily" links anywhere on the site.
  useEffect(() => {
    const onOpen = () => {
      touched.current = true;
      setCompact(false);
      setOpen(true);
    };
    window.addEventListener("lily:open", onOpen);
    return () => window.removeEventListener("lily:open", onOpen);
  }, []);

  // Welcome: once per browser session, on the landing page. The words appear straight away. The voice waits for the
  // first click or key press, because browsers never allow sound before that.
  useEffect(() => {
    if (pathname !== "/" || welcomeStarted.current || store.get(WELCOMED_KEY, true)) return;
    welcomeStarted.current = true;
    let tries = 0;
    const wait = window.setInterval(() => {
      tries += 1;
      if (document.documentElement.classList.contains("ready") || tries > 40) {
        window.clearInterval(wait);
        store.set(WELCOMED_KEY, "1", true);
        const text = welcomeText(recognitionSupported());
        welcomeText_.current = text;
        setCompact(true);
        setOpen(true);
        push({ from: "lily", text });
        if (ttsSupported() && soundRef.current) setArmed(true);
        else
          window.setTimeout(() => {
            if (!touched.current && compactRef.current) setOpen(false); // nothing to listen to, so give them time to read it, then step aside
          }, 20000);
      }
    }, 150);
    return () => {
      window.clearInterval(wait);
      // The dev server runs effects twice (start, cancel, start). If this run was cancelled before the welcome
      // appeared, let the next run start it, otherwise the welcome would never show while developing.
      if (!store.get(WELCOMED_KEY, true)) welcomeStarted.current = false;
    };
  }, [pathname, push]);

  const playWelcome = useCallback(() => {
    setArmed(false);
    void say(welcomeText_.current || welcomeText(recognitionSupported()), { id: recognitionSupported() ? "welcome" : "welcome-tap", log: false }).then(() => {
      // After the welcome, she steps out of the way unless the person has started using her.
      window.setTimeout(() => {
        if (!touched.current && compactRef.current) setOpen(false);
      }, 6000);
    });
  }, [say]);

  // While the welcome is waiting, the first click or key press anywhere on the page starts it.
  useEffect(() => {
    if (!armed) return;
    const go = (e: Event) => {
      if (rootRef.current?.contains(e.target as Node)) return; // Lily's own buttons decide for themselves
      if (e instanceof KeyboardEvent && (e.key === "Escape" || e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta")) return;
      playWelcome();
    };
    window.addEventListener("click", go, true);
    window.addEventListener("keydown", go, true);
    return () => {
      window.removeEventListener("click", go, true);
      window.removeEventListener("keydown", go, true);
    };
  }, [armed, playWelcome]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = compact ? 0 : el.scrollHeight; // the welcome card is read from its first line
  }, [msgs, open, compact]);

  function togglePause() {
    const v = voice.current;
    if (!v) return;
    if (v.state === "speaking") v.pause();
    else if (v.state === "paused") v.resume();
  }

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    soundRef.current = next;
    store.set(SOUND_KEY, next ? "on" : "off");
    if (!next) {
      voice.current?.stop();
      setArmed(false);
    }
  }

  function toggleMic() {
    const w = wake.current;
    if (!w) return;
    if (mic === "off" || mic === "blocked") {
      w.start(); // inside the click, so the browser can ask for the microphone
      if (voice.current?.busy) w.suspend();
    } else w.stop();
  }

  function minimise() {
    voice.current?.stop();
    setArmed(false);
    setOpen(false);
  }

  function expand() {
    touched.current = true;
    setCompact(false);
  }

  if (!visible) return null;

  const speaking = vstate === "speaking";
  const listening = mic === "listening" || mic === "awake";

  if (!open) {
    return (
      <div key="lily-launcher" ref={rootRef} className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        <button
          type="button"
          onClick={() => {
            touched.current = true;
            setCompact(false);
            setOpen(true);
          }}
          aria-label="Ask Lily, your LSync guide"
          className="lily-nudge flex items-center gap-2.5 rounded-full bg-white py-2 pl-2 pr-4 shadow-xl ring-1 ring-black/10 hover:ring-primary"
        >
          <Orb speaking={false} listening={listening} size={44} />
          <span className="text-sm font-bold text-ink">Ask Lily</span>
        </button>
      </div>
    );
  }

  return (
    <div
      key="lily-panel"
      ref={rootRef}
      className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[370px]"
      onKeyDown={(e) => e.key === "Escape" && minimise()}
      onPointerDownCapture={() => {
        touched.current = true;
      }}
    >
      <section role="region" aria-label="Lily, your LSync guide" className="lily-panel flex max-h-[min(72dvh,540px)] flex-col overflow-hidden rounded-3xl border-[1.5px] border-peach bg-card shadow-2xl">
        <header className="flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3">
          <Orb speaking={speaking} listening={listening} />
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold leading-tight text-ink">Lily</p>
            <p className="truncate text-xs text-muted">{speaking ? "Speaking…" : vstate === "paused" ? "Paused" : mic === "awake" ? "Listening to you…" : listening ? "Say “Hey Lily”" : "Your LSync guide"}</p>
          </div>
          <div className="flex items-center gap-0.5">
            {canListen && (
              <button
                type="button"
                onClick={toggleMic}
                aria-pressed={listening}
                aria-label={listening ? "Turn off Hey Lily" : "Turn on Hey Lily (uses your microphone)"}
                title={listening ? "Hey Lily is on" : "Turn on Hey Lily"}
                className={`grid size-9 place-items-center rounded-full ${listening ? "bg-primary text-white" : "text-ink hover:bg-black/5"}`}
              >
                {listening ? <Mic className="size-[18px]" aria-hidden /> : <MicOff className="size-[18px]" aria-hidden />}
              </button>
            )}
            <button
              type="button"
              onClick={togglePause}
              disabled={vstate === "idle"}
              aria-label={vstate === "paused" ? "Resume Lily" : "Pause Lily"}
              title={vstate === "paused" ? "Resume" : "Pause"}
              className="grid size-9 place-items-center rounded-full text-ink hover:bg-black/5 disabled:opacity-35"
            >
              {vstate === "paused" ? <Play className="size-[18px]" aria-hidden /> : <Pause className="size-[18px]" aria-hidden />}
            </button>
            {canSpeak && (
              <button type="button" onClick={toggleSound} aria-pressed={!soundOn} aria-label={soundOn ? "Mute Lily's voice" : "Turn Lily's voice on"} title={soundOn ? "Mute voice" : "Voice on"} className="grid size-9 place-items-center rounded-full text-ink hover:bg-black/5">
                {soundOn ? <Volume2 className="size-[18px]" aria-hidden /> : <VolumeX className="size-[18px]" aria-hidden />}
              </button>
            )}
            <button type="button" onClick={minimise} aria-label="Minimise Lily" title="Minimise" className="grid size-9 place-items-center rounded-full text-ink hover:bg-black/5">
              <Minus className="size-[18px]" aria-hidden />
            </button>
          </div>
        </header>

        <div ref={logRef} aria-live="polite" className={`flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4 ${compact ? "max-h-[170px] min-h-[96px]" : "min-h-[120px]"}`}>
          {(compact ? msgs.slice(-1) : msgs).map((m) => (
            <div key={m.id} className={m.from === "lily" ? "max-w-[92%]" : "max-w-[85%] self-end"}>
              <p className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.from === "lily" ? "rounded-tl-md bg-white text-ink shadow-sm" : "rounded-tr-md bg-primary text-white"}`}>{m.text}</p>
              {m.href && (
                <Link href={m.href} className="mt-1.5 inline-flex rounded-full bg-lilac-soft px-3 py-1.5 text-xs font-bold text-indigo-brand hover:bg-lilac">
                  {m.hrefLabel ?? "Open"} →
                </Link>
              )}
            </div>
          ))}
          {armed && (
            <button type="button" onClick={playWelcome} className="self-start rounded-full border border-primary px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-lilac-soft">
              <Play className="mr-1 inline size-3" aria-hidden /> Tap anywhere, or here, to hear Lily
            </button>
          )}
        </div>

        {compact ? (
          <div className="flex items-center justify-between gap-3 border-t border-black/5 px-4 py-3">
            <p className="text-xs text-muted">{canListen ? "Tap the mic to switch on Hey Lily." : "Tap me any time."}</p>
            <button type="button" onClick={expand} className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover">
              Ask me something
            </button>
          </div>
        ) : (
        <div className="border-t border-black/5 px-4 pb-3 pt-3">
          <ul className="flex flex-wrap gap-1.5" aria-label="Quick questions">
            {CHIPS.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => void ask(c.chip!)} className="rounded-full border border-peach bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-peach-soft">
                  {c.chip}
                </button>
              </li>
            ))}
          </ul>

          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const q = draft;
              setDraft("");
              void ask(q);
            }}
          >
            <label htmlFor="lily-input" className="sr-only">
              Ask Lily about LSync
            </label>
            <input id="lily-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about LSync…" maxLength={200} className="min-w-0 flex-1 rounded-xl border border-peach bg-white px-3.5 py-2.5 text-sm" />
            <button type="submit" aria-label="Send" disabled={!draft.trim()} className="grid size-10 place-items-center rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-40">
              <Send className="size-4" aria-hidden />
            </button>
          </form>

          <div className="mt-3 text-xs text-muted">
            {canListen ? (
              <>
                <button
                  type="button"
                  onClick={toggleMic}
                  aria-pressed={listening}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${listening ? "bg-primary text-white" : "border border-primary text-primary hover:bg-lilac-soft"}`}
                >
                  {listening ? <Mic className="size-3.5" aria-hidden /> : <MicOff className="size-3.5" aria-hidden />}
                  Hey Lily: {listening ? "On" : "Off"}
                </button>
                {mic === "blocked" && <p className="mt-2 text-danger">The microphone is blocked. Allow it from the lock icon in your browser&apos;s address bar, then try again.</p>}
                {listening && <p className="mt-2">Listening only while this tab is open. Your browser may send your speech to its speech service to understand it. LSync saves nothing.</p>}
              </>
            ) : (
              <p>Saying &ldquo;Hey Lily&rdquo; works in Chrome and Edge. Here you can tap or type instead.</p>
            )}
            {voiceName && canSpeak && <p className="mt-2">Voice: {voiceName}</p>}
            <p className="mt-2">Lily is an automated guide. She can only answer about LSync.</p>
          </div>
        </div>
        )}
      </section>
    </div>
  );
}
