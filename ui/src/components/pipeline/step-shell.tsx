import type { ReactNode } from "react";
import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { PIPELINE_STEPS, type StepId } from "@/state/pipeline";

/* ============================================================================
   Step shell
   ----------------------------------------------------------------------------
   Common frame for a pipeline stage: stage number, title, phase attribution,
   and an availability badge. Locked stages say so in the frame itself, not
   only inside their body copy.
   ========================================================================= */

export function StepShell({
  stepId,
  children,
  actions,
}: {
  stepId: StepId;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const step = PIPELINE_STEPS.find((item) => item.id === stepId);
  if (!step) return null;

  const locked = step.availability === "locked";

  return (
    <section aria-labelledby={`step-${step.id}-title`} className="min-w-0">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-stone pb-4">
        <div className="min-w-0">
          <p className="ak-label mb-1.5 flex items-center gap-2">
            <span>
              Stage {String(step.index).padStart(2, "0")} / {PIPELINE_STEPS.length}
            </span>
            <span aria-hidden="true" className="h-px w-4 bg-stone" />
            <span>{step.phase}</span>
          </p>
          <h1 id={`step-${step.id}-title`} className="text-[1.625rem] leading-tight sm:text-[1.875rem]">
            {step.title}
          </h1>
          <p className="mt-1.5 max-w-[68ch] text-caption text-slate">{step.summary}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {locked ? (
            <Badge tone="neutral" size="md">
              <Lock className="size-3" aria-hidden="true" />
              Not implemented
            </Badge>
          ) : (
            <Badge tone="forest" size="md">
              API connected
            </Badge>
          )}
        </div>
      </header>

      <div className={cn("pt-6")}>{children}</div>
    </section>
  );
}