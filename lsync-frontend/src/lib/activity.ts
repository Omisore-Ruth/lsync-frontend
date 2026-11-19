/** Turns learning logs and synced GitHub commits into one timeline. */
import { dayKey, fmtDay, fmtDuration, fromKey, keyOf, startOfDay, addDays } from "./stats";
import type { GithubActivity, LearningLog } from "./types";

export type ActivityItem = {
  id: string;
  source: string;
  title: string;
  subtitle: string;
  amount: string;
  when: string;
  sortKey: number;
  /** Commit whose author GitHub matched to the connected account. Not a skill certification. */
  matched?: boolean;
  url?: string;
  /** Set for entries the learner created by hand, which can be deleted. */
  logId?: string;
};

export function relativeDay(key: string, today: Date): string {
  const t = startOfDay(today);
  if (key === keyOf(t)) return "Today";
  if (key === keyOf(addDays(t, -1))) return "Yesterday";
  const d = fromKey(key);
  return fmtDay(d, d.getFullYear() !== t.getFullYear());
}

export function buildActivity(logs: LearningLog[], commits: GithubActivity[], today: Date): ActivityItem[] {
  const fromLogs: ActivityItem[] = logs.map((l) => {
    const key = dayKey(l.date);
    return {
      id: `log-${l.id}`,
      logId: l.id,
      source: l.platform,
      title: l.skill,
      subtitle: [l.platform, l.track, "Learning log"].filter(Boolean).join(" · "),
      amount: fmtDuration(l.durationMinutes),
      when: relativeDay(key, today),
      sortKey: fromKey(key).getTime(),
    };
  });
  const fromCommits: ActivityItem[] = commits.map((c) => ({
    id: `commit-${c.commitSha}`,
    source: "GitHub",
    title: c.message.split("\n")[0] || "Commit",
    subtitle: `GitHub · ${c.repository} · Commit`,
    amount: "1 commit",
    when: relativeDay(dayKey(c.committedAt), today),
    sortKey: new Date(c.committedAt).getTime(),
    matched: c.verificationStatus === "matched",
    url: c.commitUrl,
  }));
  return [...fromLogs, ...fromCommits].sort((a, b) => b.sortKey - a.sortKey);
}
