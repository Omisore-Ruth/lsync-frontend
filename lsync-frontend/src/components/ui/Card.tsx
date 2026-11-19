import type { ReactNode } from "react";

export function Card({ title, subtitle, action, children, className = "", tone = "plain" }: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string; tone?: "plain" | "peach" }) {
  return (
    <section className={`min-w-0 rounded-2xl bg-white p-5 sm:p-6 ${tone === "peach" ? "border border-peach" : ""} ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-bold text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, sub, subTone = "muted" }: { label: string; value: string; sub?: string; subTone?: "muted" | "good" }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white p-5 sm:p-6">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink sm:text-4xl">{value}</p>
      {sub && <p className={`mt-1.5 text-sm font-medium ${subTone === "good" ? "text-success" : "text-muted"}`}>{sub}</p>}
    </div>
  );
}
