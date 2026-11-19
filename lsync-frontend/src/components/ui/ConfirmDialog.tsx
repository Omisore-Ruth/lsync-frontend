"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";

/** Confirmation modal built on the native <dialog>, which gives focus trapping and Esc-to-close for free. */
export function ConfirmDialog({ open, title, children, confirmLabel, danger, busy, onConfirm, onCancel }: { open: boolean; title: string; children: ReactNode; confirmLabel: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} onClose={onCancel} aria-labelledby="confirm-title" className="m-auto w-[min(92vw,440px)] rounded-2xl p-6 shadow-2xl backdrop:bg-black/50">
      <h2 id="confirm-title" className="text-xl font-bold text-ink">
        {title}
      </h2>
      <div className="mt-2 text-body">{children}</div>
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="!py-2.5">
          Cancel
        </Button>
        <Button type="button" loading={busy} onClick={onConfirm} className={`!py-2.5 ${danger ? "!bg-danger hover:!bg-[#8f1b12]" : ""}`}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
