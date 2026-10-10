import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/* ============================================================================
   Small structural primitives.
   ========================================================================= */

export function Separator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn("h-px w-full bg-stone", className)}
      {...props}
    />
  );
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("ak-shimmer rounded-xs", className)}
      {...props}
    />
  );
}

/** Scrollable region with a sticky header — used for code and document text. */
export function ScrollArea({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("ak-scroll", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Definition row for key/value metadata.
 * `mono` renders the value in the technical typeface (IDs, codes, timestamps).
 */
export function DataRow({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 border-b border-stone/70 py-2 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4",
        className,
      )}
    >
      <dt className="ak-label w-full shrink-0 sm:w-48">{label}</dt>
      <dd
        className={cn(
          "min-w-0 flex-1 break-words text-[0.875rem] text-ink",
          mono && "ak-mono",
        )}
      >
        {value}
      </dd>
    </div>
  );
}