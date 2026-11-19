import data from "@/lib/data/edtech-insights.json";
import type { LearningLog } from "@/lib/types";
import { activeDaysIn, addDays, dayKey, fromKey, startOfDay } from "@/lib/stats";

/**
 * Everything on the Insights page and the "Learning health" card comes from here.
 * The numbers come from the EdTech dataset the group was given (see scripts/build-insights.py).
 * It is a benchmark from other students, not LSync user data, and the UI says so.
 */
export const INSIGHTS = data;
export type MetricKey = keyof typeof data.metrics;
export const STATES = ["Active", "At risk", "Dropped"] as const;

/** Chance of each outcome for a learner with these habits (small logistic model, ~80% accurate in cross-validation). */
export function predict(input: { logins: number; completion: number; posts: number }): [number, number, number] {
  const { mean, std, coef, intercept } = data.model;
  const z = [input.logins, input.completion, input.posts].map((v, i) => (v - mean[i]) / std[i]);
  const raw = coef.map((row, k) => row.reduce((s, w, i) => s + w * z[i], intercept[k]));
  const m = Math.max(...raw);
  const e = raw.map((r) => Math.exp(r - m));
  const sum = e.reduce((a, b) => a + b, 0);
  return [e[0] / sum, e[1] / sum, e[2] / sum];
}

export type Health = {
  level: "on-track" | "slowing" | "at-risk";
  title: string;
  perWeek: number; // average days with learning per week over the last 4 weeks
  silentDays: number;
  message: string;
};

/**
 * Rule of thumb from the dataset: students who show up fewer than ~2 times a week are almost all at risk or dropped,
 * and above ~4 a week most stay active. Silence only becomes a strong signal after about two weeks, so we don't
 * nag at 3 days. "Active days per week" stands in for "logins per week", which is a proxy, not the same thing.
 */
export function healthOf(logs: LearningLog[], today: Date): Health {
  const from = addDays(startOfDay(today), -27);
  const perWeek = Math.round((activeDaysIn(logs, from, today) / 4) * 10) / 10;
  const last = logs.reduce((m, l) => (dayKey(l.date) > m ? dayKey(l.date) : m), "");
  const silentDays = last ? Math.max(0, Math.round((startOfDay(today).getTime() - fromKey(last).getTime()) / 864e5)) : 999;
  if (silentDays > 14 || perWeek < 2) {
    return { level: "at-risk", title: "At risk of dropping off", perWeek, silentDays, message: silentDays > 14 ? `You've been quiet for ${silentDays} days. A 15-minute session today restarts the habit.` : "Under 2 learning days a week. Aim for 2 short sessions this week." };
  }
  if (perWeek < 4) {
    return { level: "slowing", title: "Slowing down", perWeek, silentDays, message: `${perWeek} learning days a week. Reaching 4 puts you where most active learners in the benchmark sit.` };
  }
  return { level: "on-track", title: "On track", perWeek, silentDays, message: `${perWeek} learning days a week. Keep the rhythm going.` };
}

export const pct = (v: number) => `${Math.round(v * 100)}%`;
