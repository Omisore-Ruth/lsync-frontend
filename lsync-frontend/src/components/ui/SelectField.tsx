import { forwardRef, useId, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const field = "w-full rounded-xl border bg-[#f7f5f6] px-4 py-3.5 text-base text-ink placeholder:text-muted/70";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; options: string[]; placeholder?: string };

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField({ label, error, options, placeholder, className = "", ...rest }, ref) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-base font-semibold text-ink">
        {label}
      </label>
      <select id={id} ref={ref} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} className={`${field} ${error ? "border-danger" : "border-peach"}`} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string };

export const TextAreaField = forwardRef<HTMLTextAreaElement, AreaProps>(function TextAreaField({ label, error, hint, className = "", ...rest }, ref) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-base font-semibold text-ink">
        {label}
      </label>
      <textarea id={id} ref={ref} rows={4} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} className={`${field} ${error ? "border-danger" : "border-peach"}`} {...rest} />
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
