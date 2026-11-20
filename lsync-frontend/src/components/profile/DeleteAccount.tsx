"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextField } from "@/components/ui/TextField";
import { deleteAccount } from "@/lib/api/services";

/** The backend asks for the password and the exact word DELETE, so the dialog collects both. */
export function DeleteAccount({ onDeleted }: { onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setPassword("");
    setWord("");
    setError(null);
  }

  async function confirm() {
    if (!password) return setError("Enter your password.");
    if (word !== "DELETE") return setError("Type DELETE in capital letters to confirm.");
    setBusy(true);
    setError(null);
    try {
      await deleteAccount(password);
      close();
      onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't delete your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-danger/30 bg-danger-soft p-5 sm:p-6">
      <h2 className="text-lg font-bold text-danger">Delete account</h2>
      <p className="mt-1 text-sm text-body">This permanently deletes your profile, your learning logs and your public portfolio. It can&apos;t be undone.</p>
      <Button type="button" onClick={() => setOpen(true)} className="mt-4 !bg-danger !py-2.5 text-sm hover:!bg-[#8f1b12]">
        <Trash2 className="size-4" aria-hidden /> Delete account
      </Button>
      <ConfirmDialog open={open} title="Delete your account?" confirmLabel="Delete everything" danger busy={busy} onConfirm={confirm} onCancel={close}>
        <p>Your logs and profile will be gone for good. Enter your password and type DELETE to confirm.</p>
        <div className="mt-4 grid gap-3">
          <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <TextField label="Type DELETE" autoComplete="off" value={word} onChange={(e) => setWord(e.target.value)} />
        </div>
        {error && <p role="alert" className="mt-3 text-sm font-medium text-danger">{error}</p>}
      </ConfirmDialog>
    </section>
  );
}
