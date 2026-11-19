import { useState } from "react";
import type { Cell } from "@/lib/stats";

const COLOURS = ["#ebe9f5", "#cfcaf1", "#a79ee6", "#6f63da", "#4b3fd6"];
const CELL = 14;
const GAP = 3;

/** GitHub-style calendar of daily learning time. Cells carry a tooltip; the wrapper carries the summary. */
export function Heatmap({ columns, monthLabels, summary }: { columns: Cell[][]; monthLabels: { col: number; label: string }[]; summary: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const days = ["Mon", "", "Wed", "", "Fri", "", "Sun"];
  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div role="img" aria-label={summary} className="flex gap-2">
          <div aria-hidden className="grid pt-[18px] text-[11px] text-muted" style={{ gridTemplateRows: `repeat(7, ${CELL}px)`, rowGap: GAP }}>
            {days.map((d, i) => (
              <span key={i} className="leading-[14px]">
                {d}
              </span>
            ))}
          </div>
          <div>
            <div aria-hidden className="relative h-[18px] text-[11px] text-muted" style={{ width: columns.length * (CELL + GAP) }}>
              {monthLabels.map((m) => (
                <span key={m.col} className="absolute top-0" style={{ left: m.col * (CELL + GAP) }}>
                  {m.label}
                </span>
              ))}
            </div>
            <div aria-hidden className="grid grid-flow-col" style={{ gridTemplateRows: `repeat(7, ${CELL}px)`, gridAutoColumns: `${CELL}px`, gap: GAP }}>
              {columns.flatMap((col, c) =>
                col.map((cell, r) =>
                  cell ? <div key={`${c}-${r}`} onPointerEnter={() => setHover(cell.label)} onPointerLeave={() => setHover(null)} className="rounded-[3px] transition-transform hover:scale-125" style={{ background: COLOURS[cell.level] }} /> : <div key={`${c}-${r}`} />,
                ),
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-1.5 text-xs text-muted" aria-hidden>
        <span className="min-h-4 font-semibold text-ink">{hover ?? "Hover a day to see what you learned"}</span>
        <span className="flex items-center gap-1.5">
        Less
        {COLOURS.map((c) => (
          <span key={c} className="size-3 rounded-[3px]" style={{ background: c }} />
        ))}
        More
        </span>
      </div>
    </div>
  );
}
