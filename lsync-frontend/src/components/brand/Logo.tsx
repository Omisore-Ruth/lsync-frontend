/* eslint-disable @next/next/no-img-element */
/**
 * Transparent LSync logo, cut from the PNG Dan supplied.
 * TODO: swap for the SVG (and an icon-only mark for the sidebar / favicon) once Dan exports them.
 */
export function Logo({ className = "h-12" }: { className?: string }) {
  return <img src="/brand/logo-full.webp" alt="LSync: your unified learning portfolio" width={560} height={200} decoding="async" className={`w-auto ${className}`} />;
}
