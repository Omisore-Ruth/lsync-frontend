/* A round profile picture, or the person's initials when there is no picture. */
export function initialsOf(name?: string) {
  const p = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function Avatar({ name, src, className = "size-11 text-sm" }: { name?: string; src?: string | null; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={96} height={96} className={`shrink-0 rounded-full object-cover ${className}`} />
  ) : (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-indigo-brand font-bold text-white ${className}`}>
      {initialsOf(name)}
    </span>
  );
}
