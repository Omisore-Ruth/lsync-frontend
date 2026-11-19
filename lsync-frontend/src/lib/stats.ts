/**
 * Everything on the dashboard, skills and analytics pages is derived from the learner's learning logs here.
 * That means these pages work with the confirmed backend (logs only) and need no extra "stats" endpoints.
 * All functions are pure and take `today` so they are easy to test.
 */
import type { LearningLog } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

export const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Local calendar day of a date string. Date-only strings are used as-is (no time zone shifting). */
export function dayKey(v: string | Date): string {
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  return keyOf(new Date(v));
}

export function fromKey(k: string): Date {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Weeks start on Monday. */
export const startOfWeek = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

/* ---------- formatting ---------- */

export function fmtHours(minutes: number): string {
  const h = minutes / 60;
  if (h >= 10) return `${Math.round(h)} h`;
  return `${Math.round(h * 10) / 10} h`;
}

export function fmtDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function fmtDay(d: Date, withYear = false): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) });
}

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/* ---------- basic totals ---------- */

export const totalMinutes = (logs: LearningLog[]) => logs.reduce((s, l) => s + l.durationMinutes, 0);

export function minutesByDay(logs: LearningLog[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of logs) m.set(dayKey(l.date), (m.get(dayKey(l.date)) ?? 0) + l.durationMinutes);
  return m;
}

export function minutesBetween(byDay: Map<string, number>, from: Date, to: Date): number {
  let t = 0;
  for (let d = startOfDay(from); d <= to; d = addDays(d, 1)) t += byDay.get(keyOf(d)) ?? 0;
  return t;
}

/* ---------- streaks ---------- */

export function streaks(logs: LearningLog[], today: Date) {
  const days = new Set(logs.map((l) => dayKey(l.date)));
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of sorted) {
    const d = fromKey(k);
    run = prev && keyOf(addDays(prev, 1)) === k ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  // The current streak survives until the end of the day: if nothing is logged yet today, count from yesterday.
  let cursor = startOfDay(today);
  if (!days.has(keyOf(cursor))) cursor = addDays(cursor, -1);
  let current = 0;
  while (days.has(keyOf(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, longest, activeDays: days.size };
}

/* ---------- time ranges and chart series ---------- */

export type Range = "7d" | "30d" | "4w" | "12w" | "1y";
export const RANGE_LABEL: Record<Range, string> = { "7d": "7 days", "30d": "30 days", "4w": "4 weeks", "12w": "12 weeks", "1y": "1 year" };

export type Bucket = { label: string; from: Date; to: Date };

export function bucketsFor(range: Range, today: Date): Bucket[] {
  const t = startOfDay(today);
  if (range === "7d" || range === "30d") {
    const n = range === "7d" ? 7 : 30;
    return Array.from({ length: n }, (_, i) => {
      const d = addDays(t, -(n - 1 - i));
      return { label: n === 7 ? d.toLocaleDateString("en-GB", { weekday: "short" }) : fmtDay(d), from: d, to: d };
    });
  }
  if (range === "4w" || range === "12w") {
    const n = range === "4w" ? 4 : 12;
    const thisWeek = startOfWeek(t);
    return Array.from({ length: n }, (_, i) => {
      const from = addDays(thisWeek, -(n - 1 - i) * 7);
      return { label: `Wk ${i + 1}`, from, to: addDays(from, 6) };
    });
  }
  return Array.from({ length: 12 }, (_, i) => {
    const m = 11 - i;
    const from = new Date(t.getFullYear(), t.getMonth() - m, 1);
    const to = new Date(t.getFullYear(), t.getMonth() - m + 1, 0);
    return { label: from.toLocaleDateString("en-GB", { month: "short" }), from, to };
  });
}

export function series(logs: LearningLog[], range: Range, today: Date) {
  const byDay = minutesByDay(logs);
  return bucketsFor(range, today).map((b) => ({ label: b.label, minutes: minutesBetween(byDay, b.from, b.to) }));
}

/** First day, and number of days up to today, covered by a range. */
export function periodSpan(range: Range, today: Date) {
  const from = bucketsFor(range, today)[0].from;
  const days = Math.round((startOfDay(today).getTime() - from.getTime()) / 86_400_000) + 1;
  return { from, days };
}

export function activeDaysIn(logs: LearningLog[], from: Date, today: Date): number {
  const f = keyOf(from);
  const t = keyOf(today);
  return new Set(logs.map((l) => dayKey(l.date)).filter((k) => k >= f && k <= t)).size;
}

/* ---------- groupings ---------- */

export function sourceTotals(logs: LearningLog[]) {
  const m = new Map<string, { name: string; minutes: number; sessions: number }>();
  for (const l of logs) {
    const k = l.platform.toLowerCase();
    const row = m.get(k) ?? { name: l.platform, minutes: 0, sessions: 0 };
    row.minutes += l.durationMinutes;
    row.sessions += 1;
    m.set(k, row);
  }
  return [...m.values()].sort((a, b) => b.minutes - a.minutes);
}

export function trackTotals(logs: LearningLog[]) {
  const m = new Map<string, { name: string; minutes: number; sources: Set<string> }>();
  for (const l of logs) {
    const name = l.track || "Other";
    const row = m.get(name.toLowerCase()) ?? { name, minutes: 0, sources: new Set<string>() };
    row.minutes += l.durationMinutes;
    row.sources.add(l.platform.toLowerCase());
    m.set(name.toLowerCase(), row);
  }
  return [...m.values()].sort((a, b) => b.minutes - a.minutes);
}

/**
 * Skill level is a simple rule based on hours logged (a frontend rule, not a backend value):
 * Beginner under 20 h, Intermediate 20 to 60 h, Advanced 60 h or more.
 */
export const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export const levelOf = (minutes: number): 1 | 2 | 3 => (minutes < 20 * 60 ? 1 : minutes < 60 * 60 ? 2 : 3);

export type SkillRow = {
  name: string;
  track?: string;
  platforms: string[];
  minutes: number;
  monthMinutes: number;
  level: 1 | 2 | 3;
  firstKey: string;
};

export function skillsSummary(logs: LearningLog[], today: Date): SkillRow[] {
  const monthStart = keyOf(startOfMonth(today));
  const m = new Map<string, SkillRow & { tracks: Map<string, number> }>();
  for (const l of logs) {
    const k = l.skill.trim().toLowerCase();
    const day = dayKey(l.date);
    const row =
      m.get(k) ??
      { name: l.skill.trim(), platforms: [], minutes: 0, monthMinutes: 0, level: 1 as const, firstKey: day, tracks: new Map<string, number>() };
    row.minutes += l.durationMinutes;
    if (day >= monthStart) row.monthMinutes += l.durationMinutes;
    if (day < row.firstKey) row.firstKey = day;
    if (!row.platforms.some((p) => p.toLowerCase() === l.platform.toLowerCase())) row.platforms.push(l.platform);
    if (l.track) row.tracks.set(l.track, (row.tracks.get(l.track) ?? 0) + l.durationMinutes);
    m.set(k, row);
  }
  return [...m.values()]
    .map(({ tracks, ...r }) => ({
      ...r,
      level: levelOf(r.minutes),
      track: [...tracks.entries()].sort((a, b) => b[1] - a[1])[0]?.[0],
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

/* ---------- calendar heatmap ---------- */

export type Cell = { key: string; minutes: number; level: 0 | 1 | 2 | 3 | 4; label: string } | null;

export function calendar(logs: LearningLog[], today: Date, weeks = 26) {
  const byDay = minutesByDay(logs);
  const t = startOfDay(today);
  const first = addDays(startOfWeek(t), -(weeks - 1) * 7);
  const columns: Cell[][] = [];
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  for (let c = 0; c < weeks; c++) {
    const col: Cell[] = [];
    for (let r = 0; r < 7; r++) {
      const d = addDays(first, c * 7 + r);
      if (d > t) {
        col.push(null);
        continue;
      }
      const minutes = byDay.get(keyOf(d)) ?? 0;
      const level = minutes === 0 ? 0 : minutes < 30 ? 1 : minutes < 60 ? 2 : minutes < 120 ? 3 : 4;
      col.push({ key: keyOf(d), minutes, level, label: `${fmtDay(d, true)}: ${minutes ? fmtDuration(minutes) : "no learning"}` });
    }
    const monday = addDays(first, c * 7);
    if (monday.getMonth() !== lastMonth) {
      monthLabels.push({ col: c, label: monday.toLocaleDateString("en-GB", { month: "short" }) });
      lastMonth = monday.getMonth();
    }
    columns.push(col);
  }
  return { columns, monthLabels };
}

/** The weekday with the highest average learning time. Needs at least two weeks of history to say anything. */
export function bestWeekday(logs: LearningLog[], today: Date) {
  if (!logs.length) return null;
  const byDay = minutesByDay(logs);
  const firstKey = [...byDay.keys()].sort()[0];
  const start = fromKey(firstKey);
  const t = startOfDay(today);
  const spanDays = Math.round((t.getTime() - start.getTime()) / 86_400_000) + 1;
  if (spanDays < 14) return null;
  const totals = Array<number>(7).fill(0);
  const counts = Array<number>(7).fill(0);
  for (let d = start; d <= t; d = addDays(d, 1)) {
    const i = (d.getDay() + 6) % 7;
    totals[i] += byDay.get(keyOf(d)) ?? 0;
    counts[i] += 1;
  }
  let best = 0;
  for (let i = 1; i < 7; i++) if (totals[i] / counts[i] > totals[best] / counts[best]) best = i;
  return { name: WEEKDAYS[best], avgMinutes: Math.round(totals[best] / counts[best]) };
}
