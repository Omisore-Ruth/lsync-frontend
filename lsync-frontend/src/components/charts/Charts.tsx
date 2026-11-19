/**
 * Small dependency-free SVG charts in the LSync palette.
 * Each one has a text alternative (aria-label + a hidden data table) so the numbers are available without sight.
 */

import { useState } from "react";

type Point = { label: string; value: number };

const W = 640;
const H = 260;
const PAD = { l: 46, r: 16, t: 22, b: 34 };

function niceScale(max: number) {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500];
  const step = steps.find((s) => s * 4 >= max) ?? Math.ceil(max / 4);
  return { step, max: step * 4 };
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

function Frame({ unit, scale, children }: { unit: string; scale: ReturnType<typeof niceScale>; children: React.ReactNode }) {
  const innerH = H - PAD.t - PAD.b;
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const y = PAD.t + innerH - (innerH * i) / 4;
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="#e4e1ef" strokeWidth="1" />
            <text x={PAD.l - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#6d6889">
              {fmt(scale.step * i)}
              {i === 4 ? ` ${unit}` : ""}
            </text>
          </g>
        );
      })}
      {children}
    </>
  );
}

function DataTable({ title, points, unit }: { title: string; points: Point[]; unit: string }) {
  return (
    <table className="sr-only">
      <caption>{title}</caption>
      <tbody>
        {points.map((p) => (
          <tr key={p.label}>
            <th scope="row">{p.label}</th>
            <td>
              {fmt(p.value)} {unit}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Hover, touch and arrow-key readout shared by the line and bar charts. */
function useReadout(count: number, xAt: (i: number) => number) {
  const [active, setActive] = useState<number | null>(null);
  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    for (let i = 1; i < count; i++) if (Math.abs(xAt(i) - px) < Math.abs(xAt(best) - px)) best = i;
    setActive(best);
  };
  const props = {
    tabIndex: 0,
    onPointerMove: pick,
    onPointerDown: pick,
    onPointerLeave: () => setActive(null),
    onBlur: () => setActive(null),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); setActive((a) => Math.min((a ?? -1) + 1, count - 1)); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); setActive((a) => Math.max((a ?? count) - 1, 0)); }
      else if (e.key === "Escape") setActive(null);
    },
  };
  return { active, props };
}

function Tooltip({ x, y, title, text }: { x: number; y: number; title: string; text: string }) {
  const w = Math.max(title.length, text.length) * 6.6 + 20;
  const left = Math.min(Math.max(x - w / 2, PAD.l), W - PAD.r - w);
  const top = Math.max(y - 52, 2);
  return (
    <g pointerEvents="none">
      <rect x={left} y={top} width={w} height={40} rx="8" fill="#1b1140" />
      <text x={left + 10} y={top + 16} fontSize="11" fill="#d8d3f0">{title}</text>
      <text x={left + 10} y={top + 32} fontSize="13" fontWeight="700" fill="#fff">{text}</text>
    </g>
  );
}

const HINT = "Hover, tap or use the arrow keys to read each value";

export function LineChart({ data, unit = "h", title }: { data: Point[]; unit?: string; title: string }) {
  const scale = niceScale(Math.max(...data.map((d) => d.value), 0.01));
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (data.length === 1 ? innerW / 2 : (i * innerW) / (data.length - 1));
  const y = (v: number) => PAD.t + innerH * (1 - v / scale.max);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${H - PAD.b} L${x(0).toFixed(1)},${H - PAD.b} Z`;
  const every = Math.ceil(data.length / 8);
  const labelPoints = data.length <= 12;
  const { active, props } = useReadout(data.length, x);
  const a = active === null ? null : data[active];

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}. ${HINT}`} className="h-auto w-full touch-pan-y rounded-lg" {...props}>
        <Frame unit={unit} scale={scale}>
          <path d={area} fill="#4b3fd6" fillOpacity="0.1" className="grow-y" />
          <path d={line} fill="none" stroke="#4b3fd6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {active !== null && <line x1={x(active)} x2={x(active)} y1={PAD.t} y2={H - PAD.b} stroke="#4b3fd6" strokeOpacity="0.35" strokeDasharray="4 4" />}
          {data.map((d, i) => (
            <g key={d.label + i}>
              <circle cx={x(i)} cy={y(d.value)} r={i === active ? 7 : 4.5} fill={i === active ? "#4b3fd6" : "#fff"} stroke="#4b3fd6" strokeWidth="2.5" />
              {labelPoints && d.value > 0 && active === null && (
                <text x={x(i)} y={y(d.value) - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1b1140">
                  {fmt(d.value)}
                </text>
              )}
              {(i % every === 0 || i === data.length - 1) && (
                <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#6d6889">
                  {d.label}
                </text>
              )}
            </g>
          ))}
          {a && <Tooltip x={x(active!)} y={y(a.value)} title={a.label} text={`${fmt(a.value)} ${unit}`} />}
        </Frame>
      </svg>
      <DataTable title={title} points={data} unit={unit} />
    </figure>
  );
}

export function BarChart({ data, unit = "h", title }: { data: Point[]; unit?: string; title: string }) {
  const scale = niceScale(Math.max(...data.map((d) => d.value), 0.01));
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const band = innerW / data.length;
  const bw = Math.min(46, band * 0.62);
  const every = Math.ceil(data.length / 10);
  const valueLabels = data.length <= 12;
  const cx = (i: number) => PAD.l + band * i + band / 2;
  const { active, props } = useReadout(data.length, cx);
  const a = active === null ? null : data[active];

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}. ${HINT}`} className="h-auto w-full touch-pan-y rounded-lg" {...props}>
        <Frame unit={unit} scale={scale}>
          {data.map((d, i) => {
            const h = (innerH * d.value) / scale.max;
            return (
              <g key={d.label + i}>
                <rect x={cx(i) - band / 2} y={PAD.t} width={band} height={innerH} fill="#4b3fd6" fillOpacity={i === active ? 0.08 : 0} />
                <rect className="grow-y" x={cx(i) - bw / 2} y={PAD.t + innerH - h} width={bw} height={Math.max(h, d.value > 0 ? 2 : 0)} rx="4" fill={i === active ? "#3a2fb8" : "#4b3fd6"} style={{ animationDelay: `${Math.min(i, 20) * 25}ms` }} />
                {valueLabels && d.value > 0 && active === null && (
                  <text x={cx(i)} y={PAD.t + innerH - h - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1b1140">
                    {fmt(d.value)}
                  </text>
                )}
                {(i % every === 0 || i === data.length - 1) && (
                  <text x={cx(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#6d6889">
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
          {a && <Tooltip x={cx(active!)} y={PAD.t + innerH - (innerH * a.value) / scale.max} title={a.label} text={`${fmt(a.value)} ${unit}`} />}
        </Frame>
      </svg>
      <DataTable title={title} points={data} unit={unit} />
    </figure>
  );
}

/** Horizontal labelled bars (activity by source, reading by type...). The text carries the numbers; the bar is decoration. */
export function HBars({ rows }: { rows: { label: string; value: number; display: string }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="flex flex-col gap-3.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold text-ink">{r.label}</span>
            <span className="text-body">{r.display}</span>
          </div>
          <div aria-hidden className="h-2.5 overflow-hidden rounded-full bg-lilac-soft">
            <div className="grow-x h-full rounded-full bg-indigo-brand" style={{ width: `${Math.max((r.value / max) * 100, r.value > 0 ? 3 : 0)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
