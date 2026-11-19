import { CheckCircle2, CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";

const tones = {
  success: { cls: "bg-success-soft text-success", Icon: CheckCircle2, role: "status" as const },
  error: { cls: "bg-danger-soft text-danger", Icon: CircleAlert, role: "alert" as const },
  info: { cls: "bg-lilac-soft text-indigo-brand", Icon: Info, role: "status" as const },
  warn: { cls: "bg-warn-soft text-[#7a4a00]", Icon: Info, role: "status" as const },
};

export function Banner({ tone = "info", children, action }: { tone?: keyof typeof tones; children: ReactNode; action?: ReactNode }) {
  const { cls, Icon, role } = tones[tone];
  return (
    <div role={role} className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-4 py-3 text-sm font-medium ${cls}`}>
      <Icon className="size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="grid place-items-center py-16">
      <div className="size-9 animate-spin rounded-full border-4 border-lilac border-t-primary" />
    </div>
  );
}

export function EmptyState({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-peach/70 bg-white p-8 text-center sm:p-12">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-body">{text}</p>
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
