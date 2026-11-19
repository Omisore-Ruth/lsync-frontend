"use client";

/** Small toggle group (4 weeks / 12 weeks / 1 year). Buttons, not radios, so it reads clearly to screen readers. */
export function Segmented<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${on ? "border-indigo-brand bg-lilac-soft text-indigo-brand" : "border-black/10 bg-white text-body hover:bg-black/5"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
