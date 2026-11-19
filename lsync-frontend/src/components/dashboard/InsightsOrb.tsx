import { Sparkles } from "lucide-react";
import Link from "next/link";

/**
 * The only way into the peer-insights page (it is not in the sidebar, to match Dan's menu).
 * A softly pulsing orb; on hover or keyboard focus it glows and the caption slides in.
 * Pure CSS/SVG, so it needs no animation library and respects reduced-motion (see globals.css).
 */
export function InsightsOrb() {
  return (
    <Link href="/insights" className="orb group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-plum p-4 pr-6 text-white outline-offset-4 transition-shadow hover:shadow-[0_0_44px_rgba(124,108,255,.55)] focus-visible:shadow-[0_0_44px_rgba(124,108,255,.55)]">
      <span className="relative grid size-16 shrink-0 place-items-center" aria-hidden>
        <span className="orb-ring absolute inset-0 rounded-full border border-white/40" />
        <span className="orb-ring orb-ring-2 absolute inset-0 rounded-full border border-white/30" />
        <span className="orb-core relative grid size-11 place-items-center rounded-full bg-gradient-to-br from-[#b9acff] to-indigo-brand shadow-[0_0_18px_rgba(185,172,255,.8)] transition-transform duration-300 group-hover:scale-110 group-focus-visible:scale-110">
          <Sparkles className="size-5" />
        </span>
      </span>
      <span className="min-w-0">
        <span className="block font-bold">Peer insights</span>
        <span className="block text-sm text-white/85">See how learners in other cities and countries are doing.</span>
        <span className="mt-1 block max-h-0 translate-y-1 overflow-hidden text-sm font-semibold text-[#d9d2ff] opacity-0 transition-all duration-300 group-hover:max-h-6 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:max-h-6 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          Open insights from other learners →
        </span>
      </span>
    </Link>
  );
}
