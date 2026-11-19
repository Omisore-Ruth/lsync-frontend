import { BookOpen } from "lucide-react";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { sourceMeta } from "@/lib/sources";

/** Real brand mark on a soft tile. GitHub sits on dark, the rest on white with a hairline border. Unknown sources get a letter. */
export function SourceBadge({ name, size = 40 }: { name: string; size?: number }) {
  const s = sourceMeta(name);
  const brand = BRAND_ICONS[s.id];
  const dark = s.id === "GitHub";
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-xl font-bold ${dark ? "" : "border border-black/10"}`}
      style={{ width: size, height: size, background: dark ? "#14142B" : "#FFFFFF", color: dark ? "#FFFFFF" : s.fg, fontSize: size * 0.42 }}
    >
      {brand ? (
        <svg viewBox="0 0 24 24" width={size * 0.56} height={size * 0.56} fill={dark ? "#FFFFFF" : brand.hex}>
          <path d={brand.path} />
        </svg>
      ) : s.id === "Blogs and docs" ? (
        <BookOpen style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2} />
      ) : (
        s.letter
      )}
    </span>
  );
}
