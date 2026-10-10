import { forwardRef, type HTMLAttributes, type InputHTMLAttributes, type LabelHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/* ============================================================================
   Form primitives
   ========================================================================= */

export const Label = forwardRef<
  HTMLLabelElement,
  LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("ak-label block", className)}
    {...props}
  />
));
Label.displayName = "Label";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "h-9 w-full rounded-xs border border-stone bg-surface px-3 font-sans text-[0.875rem] text-ink placeholder:text-slate",
      "focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30",
      "disabled:cursor-not-allowed disabled:bg-paper disabled:text-slate",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xs border border-stone bg-surface px-3 py-2 font-sans text-[0.875rem] leading-relaxed text-ink placeholder:text-slate",
      "focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/** Field wrapper: label, optional hint, optional error. Used by every form. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-caption text-denial" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-caption text-slate">{hint}</p>
      ) : null}
    </div>
  );
}

/** Native file input, visually replaced but fully keyboard accessible. */
export const FileInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="file"
    className={cn(
      "block w-full cursor-pointer rounded-xs border border-stone bg-surface text-caption text-ink",
      "file:mr-3 file:cursor-pointer file:border-0 file:border-r file:border-stone file:bg-paper file:px-3 file:py-1.5 file:font-sans file:text-[0.8125rem] file:font-medium file:text-ink",
      "focus:outline-none focus:ring-1 focus:ring-forest/30",
      className,
    )}
    {...props}
  />
));
FileInput.displayName = "FileInput";

/** Thin horizontal rule with optional inline label. */
export function Divider({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={cn("h-px w-full bg-stone", className)} {...props} />;
}