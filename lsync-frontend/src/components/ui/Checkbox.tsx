import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { children: ReactNode; error?: string };

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox({ children, error, className = "", style, ...rest }, ref) {
  return (
    <div className={className} style={style}>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-body">
        <input ref={ref} type="checkbox" className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary" {...rest} />
        <span>{children}</span>
      </label>
      {error && (
        <p role="alert" className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
