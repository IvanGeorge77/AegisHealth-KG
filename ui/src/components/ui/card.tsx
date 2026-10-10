import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/* ============================================================================
   Card — the reading surface.
   ----------------------------------------------------------------------------
   Deliberately flat: paper background, one hairline border, minimal radius.
   Deliberately NOT every element wrapped in a card — use a plain div with
   `.ak-rule-editorial` or a `<section>` where a container would add noise.
   ========================================================================= */

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("ak-surface rounded-xs", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-stone px-5 py-3.5",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-sans text-[0.875rem] font-semibold leading-snug", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-caption text-slate", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-stone bg-paper/50 px-5 py-3",
        className,
      )}
      {...props}
    />
  );
}