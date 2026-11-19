import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "dark";
  loading?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold transition-[background-color,transform,box-shadow] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100";

const variants = {
  primary: "bg-primary text-white hover:-translate-y-px hover:bg-primary-hover hover:shadow-[0_10px_22px_-10px_rgba(122,61,184,0.75)] motion-reduce:hover:translate-y-0",
  outline: "border border-peach bg-white text-ink hover:bg-peach-soft",
  dark: "bg-ink text-white hover:bg-black",
};

export function Button({ variant = "primary", loading, disabled, className = "", children, ...rest }: Props) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
