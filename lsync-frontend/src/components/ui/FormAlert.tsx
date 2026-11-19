import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

export function FormAlert({ message, children }: { message?: string | null; children?: ReactNode }) {
  if (!message) return null;
  return (
    <div key={message} role="alert" className="shake flex items-start gap-2.5 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <span>{message}</span>
        {children}
      </div>
    </div>
  );
}
