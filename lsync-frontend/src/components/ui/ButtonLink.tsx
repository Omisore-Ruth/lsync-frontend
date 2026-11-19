import Link from "next/link";
import type { ComponentProps } from "react";

const base = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold transition-colors";
const variants = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  outline: "border border-peach bg-white text-ink hover:bg-peach-soft",
};

/** A link that looks like a Button. Use it for navigation; use <Button> for actions. */
export function ButtonLink({ variant = "primary", className = "", ...rest }: ComponentProps<typeof Link> & { variant?: keyof typeof variants }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}
