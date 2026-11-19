"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Sync hub with four source tiles (sign-in artwork). Decorative.
 * One 10-second beat: the tiles gather into the hub, lines shoot out to the four corners, the tiles burst back out,
 * then the whole group turns a quarter and the tiles end up in each other's places. The next beat starts from that
 * rotated layout (the slot assignment shifts by one), so the loop never jumps. All motion is CSS; see globals.css.
 */
const TILES = [
  { letter: "C", bg: "#ECE9FB", fg: "#3B2FC9" },
  { letter: "G", bg: "#14142B", fg: "#FFFFFF" },
  { letter: "Y", bg: "#FFF3D6", fg: "#1B1140" },
  { letter: "e", bg: "#DDF4EC", fg: "#0B6B55" },
];
// Clockwise: top-left, top-right, bottom-right, bottom-left. Offsets from the centre in container-width units.
const SLOTS: [number, number][] = [
  [-30, -30],
  [30, -30],
  [30, 30],
  [-30, 30],
];
const BEAT_MS = 10000;

export function SyncDiagram() {
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setBeat((b) => b + 1), BEAT_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto aspect-[1.2/1] w-full max-w-[460px] [container-type:inline-size]" aria-hidden>
      {/* Remounting each beat restarts the CSS animations; the shifted slots make the first frame match the last. */}
      <div key={beat} className="absolute inset-0">
        <svg viewBox="0 0 100 83.33" className="absolute inset-0 size-full" fill="none">
          {SLOTS.map(([dx, dy]) => {
            const x = 50 + (dx * 100) / 100;
            const y = 41.67 + dy;
            return (
              <g key={`${dx}${dy}`}>
                <line x1="50" y1="41.67" x2={x} y2={y} stroke="white" strokeOpacity="0.4" strokeWidth="0.45" strokeDasharray="1.6 1.6" className="dash-flow" />
                <line x1="50" y1="41.67" x2={x} y2={y} pathLength="100" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeDasharray="14 100" className="sd-shoot" />
              </g>
            );
          })}
        </svg>

        <div className="sd-orbit absolute inset-0">
          {TILES.map((t, i) => {
            const [sx, sy] = SLOTS[(i + beat) % 4];
            return (
              <div key={t.letter} className="sd-tile absolute left-1/2 top-1/2 size-[17cqw] -ml-[8.5cqw] -mt-[8.5cqw]" style={{ "--sx": sx, "--sy": sy } as React.CSSProperties}>
                <span className="sd-face grid size-full place-items-center rounded-xl text-xl font-bold shadow-lg" style={{ background: t.bg, color: t.fg }}>
                  {t.letter}
                </span>
              </div>
            );
          })}
        </div>

        <div className="absolute left-1/2 top-1/2 size-[24cqw] -translate-x-1/2 -translate-y-1/2">
          <span className="sd-ring absolute inset-0 rounded-2xl border-2 border-white" />
          <div className="sd-hub grid size-full place-items-center rounded-2xl bg-white shadow-xl">
            <RefreshCw className="sd-icon size-1/2 text-indigo-brand" strokeWidth={2.2} />
          </div>
        </div>
      </div>
    </div>
  );
}
