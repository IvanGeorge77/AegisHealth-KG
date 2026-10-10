import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/* ============================================================================
   Page chrome
   ----------------------------------------------------------------------------
   Editorial page furniture: a serif title, an optional deck line, and a single
   hairline. Actions sit in a compact right-hand column rather than being
   centred or spread across the width.

   Heading levels: the top bar owns `<h1>` (the section name), so a page title
   here is `<h2>` and region labels are `<h3>`. The outline stays in order.
   ========================================================================= */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("pb-6", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="ak-label mb-2 flex items-center gap-2">
              <span>{eyebrow}</span>
              <span aria-hidden="true" className="h-px w-6 bg-stone" />
            </p>
          ) : null}
          <h2 className="text-[1.75rem] leading-[1.15] text-ink sm:text-[2rem]">{title}</h2>
          {description ? (
            <p className="mt-3 max-w-[68ch] text-[0.9375rem] leading-relaxed text-slate">
              {description}
            </p>
          ) : null}
          {meta ? <div className="mt-4">{meta}</div> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

/**
 * Uppercase micro heading used above each region of a page.
 * Separates regions by whitespace; no rule is drawn.
 */
export function SectionLabel({
  children,
  className,
  trailing,
}: {
  children: ReactNode;
  className?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className={cn("mb-4 flex items-baseline justify-between gap-3", className)}>
      <h3 className="ak-label">{children}</h3>
      {trailing ? <span className="text-caption text-slate">{trailing}</span> : null}
    </div>
  );
}

/** Main content region. Constrained for reading, generous gutters. */
export function PageBody({
  children,
  className,
  width = "wide",
}: {
  children: ReactNode;
  className?: string;
  width?: "wide" | "reading";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 py-6 sm:px-8 sm:py-8",
        width === "reading" ? "max-w-[68ch]" : "max-w-[1440px]",
        className,
      )}
    >
      {children}
    </div>
  );
}