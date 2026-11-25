/**
 * Lily's voice. Speech is spoken one sentence at a time because browsers cut long utterances off,
 * and because it makes Pause and Resume reliable (Pause remembers the sentence and Resume replays it).
 * If a recorded clip is listed in /lily/manifest.json it plays instead, so you can swap in a studio Canadian voice.
 */

export type VoiceState = "idle" | "speaking" | "paused";

const MALE = /\b(david|mark|james|george|guy|liam|ryan|richard|alex|fred|daniel|thomas|ravi|rishi|oliver|aaron|gordon|arthur|male)\b/i;
const FEMALE = /(clara|samantha|aria|jenny|natasha|libby|sonia|karen|moira|tessa|serena|zira|susan|catherine|allison|ava|joanna|nicole|female)/i;

export const ttsSupported = () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

/** Prefers a soft Canadian English voice, then other natural female English voices. Voices differ per device. */
export function pickVoice(): SpeechSynthesisVoice | null {
  if (!ttsSupported()) return null;
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  if (!voices.length) return null;
  const score = (v: SpeechSynthesisVoice) => {
    const lang = v.lang.replace("_", "-").toLowerCase();
    let s = 0;
    if (lang === "en-ca") s += 100;
    else if (lang === "en-us") s += 10;
    else if (lang === "en-gb") s += 6;
    if (/natural|neural|online/i.test(v.name)) s += 30;
    if (FEMALE.test(v.name)) s += 20;
    if (MALE.test(v.name)) s -= 60;
    if (v.localService === false && /google/i.test(v.name)) s += 5;
    return s;
  };
  return [...voices].sort((a, b) => score(b) - score(a))[0];
}

export function voiceLabel(v: SpeechSynthesisVoice | null): string | null {
  if (!v) return null;
  const name = v.name.replace(/^Microsoft\s+/i, "").replace(/\s*-\s*English.*$/i, "").replace(/\(Natural\)|Online/gi, "").replace(/\s+/g, " ").trim();
  return `${name} (${v.lang.replace("_", "-")})`;
}

/**
 * How words are spelled for the speech engine only. What people read on screen is unchanged.
 * Browser voices say "LSync" as one lumpy word, so she says the letter, then "sync": "El Sync".
 */
export function pronounce(text: string): string {
  return text
    .replace(/\bL-?sync\b/gi, "El Sync")
    .replace(/\bedX\b/g, "ed X")
    .replace(/\bBeTechified\b/g, "Be Techified")
    .replace(/\bDemo1234\b/g, "Demo, one, two, three, four");
}

function chunk(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const out: string[] = [];
  for (const s of sentences) {
    const t = s.trim();
    if (!t) continue;
    if (t.length <= 220) out.push(t);
    else t.split(/(?<=,)\s+/).forEach((p) => p.trim() && out.push(p.trim()));
  }
  return out;
}

export class LilyVoice {
  state: VoiceState = "idle";
  onState: (s: VoiceState) => void = () => {};
  private audioMap: Record<string, string> = {};
  private gen = 0;
  private chunks: string[] = [];
  private idx = 0;
  private audio: HTMLAudioElement | null = null;
  private done: (() => void) | null = null;
  private current: SpeechSynthesisUtterance | null = null; // kept so the browser doesn't garbage-collect it mid-speech
  voice: SpeechSynthesisVoice | null = null;

  get busy() {
    return this.state !== "idle";
  }

  setAudioMap(map: Record<string, string>) {
    this.audioMap = map;
  }

  private set(s: VoiceState) {
    this.state = s;
    this.onState(s);
  }

  /** Speaks the text. Resolves when it finishes or is stopped. Starts synchronously, so call it from a click or key press. */
  speak(text: string, id?: string): Promise<void> {
    this.stop();
    const myGen = ++this.gen;
    return new Promise<void>((resolve) => {
      this.done = resolve;
      this.set("speaking");
      const url = id ? this.audioMap[id] : undefined;
      if (url) {
        const a = new Audio(url);
        this.audio = a;
        a.onended = () => this.finish(myGen);
        a.onerror = () => {
          this.audio = null;
          if (myGen === this.gen) this.startChunks(text, myGen); // the clip failed to load: use the browser voice
        };
        a.play().catch(() => {
          this.audio = null;
          if (myGen === this.gen) this.startChunks(text, myGen);
        });
        return;
      }
      this.startChunks(text, myGen);
    });
  }

  private startChunks(text: string, myGen: number) {
    if (!ttsSupported()) return this.finish(myGen);
    this.voice = this.voice ?? pickVoice();
    this.chunks = chunk(pronounce(text));
    this.idx = 0;
    this.next(myGen);
  }

  private next(myGen: number) {
    if (myGen !== this.gen) return;
    if (this.idx >= this.chunks.length) return this.finish(myGen);
    const u = new SpeechSynthesisUtterance(this.chunks[this.idx]);
    this.voice = this.voice ?? pickVoice();
    if (this.voice) {
      u.voice = this.voice;
      u.lang = this.voice.lang;
    } else u.lang = "en-CA";
    u.rate = 0.96; // a touch slower and higher reads as soft and friendly
    u.pitch = 1.06;
    u.onend = () => {
      if (myGen !== this.gen || this.state === "paused") return;
      this.idx += 1;
      this.next(myGen);
    };
    u.onerror = (e) => {
      if (myGen !== this.gen || this.state === "paused") return;
      if (e.error === "canceled" || e.error === "interrupted") return;
      this.finish(myGen);
    };
    this.current = u;
    speechSynthesis.speak(u);
  }

  private finish(myGen: number) {
    if (myGen !== this.gen) return;
    this.audio = null;
    this.current = null;
    this.set("idle");
    const d = this.done;
    this.done = null;
    d?.();
  }

  pause() {
    if (this.state !== "speaking") return;
    this.set("paused");
    if (this.audio) this.audio.pause();
    else if (ttsSupported()) speechSynthesis.cancel(); // resume replays the current sentence
  }

  resume() {
    if (this.state !== "paused") return;
    this.set("speaking");
    if (this.audio) void this.audio.play();
    else this.next(this.gen);
  }

  stop() {
    this.gen += 1; // anything still pending from the old speech is now ignored
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    if (ttsSupported()) speechSynthesis.cancel();
    this.current = null;
    if (this.state !== "idle") this.set("idle");
    const d = this.done;
    this.done = null;
    d?.();
  }
}
