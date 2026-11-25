/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * "Hey Lily": listens through the browser's speech recognition (Chrome, Edge and, partly, Safari).
 * It only runs after the person switches the microphone on, and it is paused while Lily speaks so she never hears herself.
 */

export type WakeState = "off" | "listening" | "awake" | "blocked";

export const recognitionSupported = () => typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

/** "hey lily", with the spellings speech recognition tends to return. */
const WAKE = /\b(?:hey|hi|hello|okay|ok)[\s,.!-]*(?:lily|lilly|lilli|lili|lilie|lillie|leelee)\b/i;
const NAME_ONLY = /^\s*(?:lily|lilly|lilli|lili)[\s.!?]*$/i;
const AWAKE_MS = 12000;

export class WakeListener {
  private rec: any = null;
  private wanted = false;
  private suspended = false;
  private awake = false;
  private failures = 0;
  private restart: ReturnType<typeof setTimeout> | undefined;
  private awakeTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private cb: {
      onWake: () => void;
      onQuestion: (q: string) => void;
      onState: (s: WakeState) => void;
    },
  ) {}

  /** Must be called from a click, so the browser can ask for the microphone. */
  start() {
    this.wanted = true;
    this.suspended = false;
    this.failures = 0;
    this.cb.onState("listening");
    this.spin();
  }

  stop() {
    this.wanted = false;
    this.clearAwake();
    this.kill();
    this.cb.onState("off");
  }

  /** Stop hearing while Lily talks. */
  suspend() {
    this.suspended = true;
    this.kill();
  }

  resume() {
    this.suspended = false;
    if (this.wanted) this.spin();
  }

  private clearAwake() {
    this.awake = false;
    if (this.awakeTimer) clearTimeout(this.awakeTimer);
  }

  private kill() {
    if (this.restart) clearTimeout(this.restart);
    const r = this.rec;
    this.rec = null;
    if (!r) return;
    r.onend = r.onerror = r.onresult = null;
    try {
      r.abort();
    } catch {
      /* already stopped */
    }
  }

  private spin() {
    if (!this.wanted || this.suspended || this.rec) return;
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) return;
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = navigator.language?.toLowerCase().startsWith("en") ? navigator.language : "en-US";
    r.onresult = (e: any) => this.handle(e);
    r.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        this.wanted = false;
        this.rec = null;
        this.clearAwake();
        this.cb.onState("blocked");
      } else if (e.error === "network") this.failures += 1;
    };
    r.onend = () => {
      this.rec = null;
      if (this.wanted && !this.suspended) this.restart = setTimeout(() => this.spin(), Math.min(250 + this.failures * 750, 4000));
    };
    try {
      r.start();
      this.rec = r;
    } catch {
      this.failures += 1;
      this.restart = setTimeout(() => this.spin(), 1000);
    }
  }

  private handle(e: any) {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (!res.isFinal) continue; // wait for the end of the sentence so Lily never talks over the person
      const text = String(res[0]?.transcript ?? "").trim();
      if (!text) continue;
      const m = WAKE.exec(text);
      if (!this.awake) {
        if (m) {
          const rest = text.slice(m.index + m[0].length).replace(/^[\s,.:;!?-]+/, "").trim();
          if (rest.split(/\s+/).filter(Boolean).length >= 2) return this.cb.onQuestion(rest); // "Hey Lily, what is LSync?"
          this.awake = true;
          this.cb.onState("awake");
          this.awakeTimer = setTimeout(() => {
            this.awake = false;
            this.cb.onState("listening");
          }, AWAKE_MS);
          return this.cb.onWake();
        }
        if (NAME_ONLY.test(text)) {
          this.awake = true;
          this.cb.onState("awake");
          this.awakeTimer = setTimeout(() => {
            this.awake = false;
            this.cb.onState("listening");
          }, AWAKE_MS);
          return this.cb.onWake();
        }
        continue;
      }
      // Awake: the next sentence is the question.
      this.clearAwake();
      this.cb.onState("listening");
      const q = m ? text.slice(m.index + m[0].length).replace(/^[\s,.:;!?-]+/, "").trim() || text : text;
      return this.cb.onQuestion(q);
    }
  }
}
