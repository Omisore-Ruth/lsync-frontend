/* eslint-disable @next/next/no-img-element */
/**
 * Transparent LSync logo, cut from the PNG Dan supplied.
 * TODO: swap for the SVG (and an icon-only mark for the sidebar / favicon) once Dan exports them.
 */
export function Logo({ className = "h-12" }: { className?: string }) {
  return <img src="/brand/logo-full.png" alt="LSync: your unified learning portfolio" className={`w-auto ${className}`} />;
}
