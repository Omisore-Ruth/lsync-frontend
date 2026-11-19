/** The places someone learns. Drives the source cards, platform dropdown and the coloured letter tiles. */
export type Source = {
  id: string;
  letter: string;
  bg: string;
  fg: string;
  blurb: string;
  /** "connect" = linked through the backend (OAuth). "manual" = the learner logs it themselves. */
  mode: "connect" | "manual";
  /** Connecting is planned but the backend route isn't confirmed yet. */
  connectSoon?: boolean;
};

export const SOURCES: Source[] = [
  { id: "GitHub", letter: "G", bg: "#14142B", fg: "#FFFFFF", blurb: "Code repositories", mode: "connect" },
  { id: "YouTube", letter: "Y", bg: "#FFF3D6", fg: "#1B1140", blurb: "Video learning", mode: "manual", connectSoon: true },
  { id: "Coursera", letter: "C", bg: "#ECE9FB", fg: "#3B2FC9", blurb: "Online courses", mode: "manual" },
  { id: "Udemy", letter: "U", bg: "#4B3FD6", fg: "#FFFFFF", blurb: "Online courses", mode: "manual" },
  { id: "edX", letter: "e", bg: "#DDF4EC", fg: "#0B6B55", blurb: "Online courses", mode: "manual" },
  { id: "Blogs and docs", letter: "+", bg: "#F1EEF8", fg: "#4A4466", blurb: "Articles and technical docs", mode: "manual" },
];

/** Options in the "Where did you learn it?" dropdown. */
export const PLATFORM_OPTIONS = [...SOURCES.map((s) => s.id), "Other"];

export const TRACK_SUGGESTIONS = ["Data", "Design", "Development", "Business", "Writing"];

export function sourceMeta(name: string): Source {
  const found = SOURCES.find((s) => s.id.toLowerCase() === name.toLowerCase());
  if (found) return found;
  return { id: name, letter: (name[0] ?? "?").toUpperCase(), bg: "#F1EEF8", fg: "#4A4466", blurb: "", mode: "manual" };
}
