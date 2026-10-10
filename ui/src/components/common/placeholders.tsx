import { Construction, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

/* ============================================================================
   Placeholder scaffolding for unimplemented phases
   ----------------------------------------------------------------------------
   These containers communicate *honest absence*: the stage exists, it is
   designed, and it is not yet running. They must never show fabricated
   analysis. Content inside a `LockedPanel` is labelled as illustrative.
   ========================================================================= */

export interface LockedPanelProps {
  /** e.g. "Phase 6" */
  phase: string;
  /** e.g. "Graph reasoning engine" */
  title: string;
  /** What the stage will do once implemented. */
  description: string;
  /** Extra structural notes for whoever implements it. */
  contract?: string[];
  className?: string;
  children?: ReactNode;
}

/**
 * A structural placeholder: header describing the pending stage, an honest
 * "not implemented" badge, and empty containers shaped like the real thing.
 */
export function LockedPanel({
  phase,
  title,
  description,
  contract,
  className,
  children,
}: LockedPanelProps) {
  return (
    <section
      aria-label={`${phase} — ${title} (not implemented)`}
      className={cn("flex h-full flex-col", className)}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-stone pb-4">
        <div className="min-w-0">
          <div className="ak-label mb-1.5 flex items-center gap-2">
            <span>{phase}</span>
            <span aria-hidden="true" className="h-px w-4 bg-stone" />
            <span>Pending</span>
          </div>
          <h2 className="text-[1.375rem] leading-tight">{title}</h2>
          <p className="mt-1.5 max-w-[62ch] text-caption text-slate">{description}</p>
        </div>
        <Badge tone="ochre" size="md">
          <Construction className="size-3" aria-hidden="true" />
          Coming soon
        </Badge>
      </header>

      {contract && contract.length > 0 ? (
        <dl className="mt-4 grid gap-x-8 gap-y-2 border border-dashed border-stone bg-surface/60 px-4 py-3 sm:grid-cols-[10rem_1fr]">
          {contract.map((item, index) => (
            <div key={index} className="contents">
              <dt className="ak-label pt-0.5">{item.split(":")[0]}</dt>
              <dd className="ak-mono text-slate">{item.split(":").slice(1).join(":").trim()}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-5 min-h-0 flex-1">{children}</div>
    </section>
  );
}

/** Dotted outline used for containers that are shaped but not yet filled. */
export function EmptyContainer({
  label,
  hint,
  icon: Icon,
  className,
  rows = 3,
}: {
  label: string;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
  rows?: number;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xs border border-dashed border-stone bg-surface/50",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-dashed border-stone px-4 py-2.5">
        {Icon ? <Icon className="size-3.5 text-slate" aria-hidden="true" /> : null}
        <span className="ak-label">{label}</span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2.5 px-4 py-6">
        {hint ? (
          <p className="mb-1 max-w-[52ch] text-caption text-slate">{hint}</p>
        ) : null}
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <div className="h-2 w-2/3 rounded-xs bg-stone/60" />
            <div className="h-2 w-full rounded-xs bg-stone/40" />
          </div>
        ))}
        <p className="mt-2 text-caption italic text-slate">
          Structural placeholder — no data is displayed here yet.
        </p>
      </div>
    </div>
  );
}

/** Full-panel state for an empty workspace. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xs border border-dashed border-stone bg-surface/60 px-8 py-14 text-center",
        className,
      )}
    >
      {Icon ? <Icon className="size-6 text-slate" aria-hidden="true" /> : null}
      <div className="space-y-1">
        <h3 className="text-[1.0625rem]">{title}</h3>
        <p className="mx-auto max-w-[46ch] text-caption text-slate">{description}</p>
      </div>
      {action}
    </div>
  );
}

/** Informational notice. `tone` maps to the reserved status colours. */
export function Notice({
  tone = "neutral",
  title,
  children,
  icon: Icon,
  className,
}: {
  tone?: "neutral" | "ochre" | "rust" | "forest";
  title?: string;
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  const tones = {
    neutral: "border-stone bg-surface",
    ochre: "border-ochre/40 bg-ochre-soft",
    rust: "border-denial/30 bg-denial-soft",
    forest: "border-forest/25 bg-forest-soft",
  } as const;

  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-xs border px-3.5 py-3 text-caption",
        tones[tone],
        className,
      )}
    >
      {Icon ? <Icon className="mt-0.5 size-4 shrink-0 text-slate" aria-hidden="true" /> : null}
      <div className="min-w-0 space-y-1">
        {title ? <p className="font-semibold text-ink">{title}</p> : null}
        <div className="text-slate">{children}</div>
      </div>
    </div>
  );
}