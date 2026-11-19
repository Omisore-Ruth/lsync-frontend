const LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const COLOURS = ["", "#b42318", "#c2570c", "#6d8f1f", "#0f7b5f"];

function score(pw: string) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (pw.length >= 12 || /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.max(s, 1);
}

/** Four segments that fill as the password gets stronger. The word repeats the colour, so colour is never the only signal. */
export function PasswordMeter({ value }: { value: string }) {
  const s = score(value);
  return (
    <div className="-mt-2" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className="h-1.5 flex-1 rounded-full bg-black/10 transition-colors duration-300" style={i <= s ? { background: COLOURS[s] } : undefined} />
        ))}
      </div>
      <p className="mt-1.5 min-h-5 text-sm font-semibold" style={{ color: s ? COLOURS[s] : undefined }}>
        {s ? `Password strength: ${LABELS[s]}` : ""}
      </p>
    </div>
  );
}
