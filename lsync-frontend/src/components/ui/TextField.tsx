"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

/** Labelled input with inline error + hint. type="password" gets a show/hide toggle. */
export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, error, hint, type = "text", className = "", style, ...rest },
  ref,
) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  // Phone keyboards love to capitalise the first letter, "fix" words and add a space after a suggestion.
  // That silently changes an email or password, which then looks like "wrong password". Turn it off for these fields.
  const keyboardSafe = type === "email" || isPassword ? { autoCapitalize: "none", autoCorrect: "off", spellCheck: false } : {};
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className} style={style}>
      <label htmlFor={id} className="mb-2 block text-base font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={ref}
          type={isPassword && shown ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`field w-full rounded-xl border bg-[#f7f5f6] transition-[border-color,box-shadow] duration-200 px-4 py-3.5 text-base text-ink placeholder:text-muted/70 ${
            isPassword ? "pr-12" : ""
          } ${error ? "border-danger" : "border-peach"}`}
          {...keyboardSafe}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? "Hide password" : "Show password"}
            aria-pressed={shown}
            className="absolute inset-y-0 right-2 my-auto grid size-10 place-items-center rounded-lg text-body hover:bg-black/5"
          >
            {shown ? <Eye className="size-5" aria-hidden /> : <EyeOff className="size-5" aria-hidden />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-body">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
