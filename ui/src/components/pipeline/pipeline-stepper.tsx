import { Check, ChevronRight, Lock } from "lucide-react";

import { cn } from "@/lib/cn";
import {
  PIPELINE_STEPS,
  usePipeline,
  type StageStatus,
  type StepDefinition,
  type StepId,
} from "@/state/pipeline";

/* ============================================================================
   Pipeline stepper
   ----------------------------------------------------------------------------
   A vertical timeline of the six pipeline stages. It is the primary wayfinding
   device inside the case workspace and must mirror the store exactly:

     locked   — cannot be entered; renders a badge, not a fake result
     ready    — enterable; disabled until its prerequisite stage completes
     active   — currently displayed
     complete — finished successfully

   Below `lg` the timeline becomes a horizontal scroller so the content column
   keeps the full width of the viewport on tablets and phones.
   ========================================================================= */

export function PipelineStepper({ className }: { className?: string }) {
  const { activeStep, navigate, statuses, hasDocument } = usePipeline();

  return (
    <nav aria-label="Case pipeline" className={cn("min-w-0", className)}>
      {/* Desktop: vertical timeline */}
      <ol className="hidden min-w-0 lg:block">
        {PIPELINE_STEPS.map((step, index) => (
          <StepperItem
            key={step.id}
            step={step}
            isActive={activeStep === step.id}
            isLast={index === PIPELINE_STEPS.length - 1}
            status={statuses[step.id]}
            disabled={step.id === "extraction" && !hasDocument}
            onSelect={() => navigate(step.id)}
          />
        ))}
      </ol>

      {/* Mobile / tablet: horizontal scroller */}
      <ol className="ak-scroll flex w-full min-w-0 gap-2 overflow-x-auto pb-2 lg:hidden">
        {PIPELINE_STEPS.map((step, index) => (
          <li key={step.id} className="flex shrink-0 items-center">
            <StepperChip
              step={step}
              index={index}
              isActive={activeStep === step.id}
              status={statuses[step.id]}
              disabled={step.id === "extraction" && !hasDocument}
              onSelect={() => navigate(step.id)}
            />
            {index < PIPELINE_STEPS.length - 1 ? (
              <ChevronRight className="size-3.5 shrink-0 text-stone" aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function StepperItem({
  step,
  isActive,
  isLast,
  status,
  disabled,
  onSelect,
}: {
  step: StepDefinition;
  isActive: boolean;
  isLast: boolean;
  status: StageStatus;
  disabled: boolean;
  onSelect: () => void;
}) {
  const isLocked = step.availability === "locked";
  const complete = status === "complete";
  const processing = status === "processing";

  return (
    <li className="relative">
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-current={isActive ? "step" : undefined}
        className={cn(
          "group flex w-full items-start gap-3 py-3 pl-1 pr-3 text-left transition-colors",
          disabled
            ? "cursor-not-allowed opacity-45"
            : "cursor-pointer hover:bg-ink/[0.03]",
          isActive && !disabled && "bg-ink/[0.04]",
        )}
      >
        {/* Rail + node */}
        <span className="relative flex shrink-0 flex-col items-center">
          <Node isActive={isActive} isLocked={isLocked} complete={complete} processing={processing} />
          {!isLast ? (
            <span
              aria-hidden="true"
              className={cn(
                "mt-1 w-px flex-1",
                complete ? "bg-forest/50" : "bg-stone",
              )}
            />
          ) : null}
        </span>

        {/* Label block */}
        <span className="min-w-0 flex-1 pb-1">
          <span className="flex items-baseline gap-2">
            <span className="ak-mono text-slate">{String(step.index).padStart(2, "0")}</span>
            <span
              className={cn(
                "truncate text-[0.875rem] font-medium",
                isActive ? "text-ink" : "text-ink/80",
              )}
            >
              {step.title}
            </span>
          </span>
          <span className="mt-0.5 flex items-center gap-2 pl-7">
            {isLocked ? (
              <span className="flex items-center gap-1 font-mono text-note uppercase tracking-[0.08em] text-slate">
                <Lock className="size-2.5" aria-hidden="true" />
                Locked
              </span>
            ) : null}
            <span className="font-mono text-note uppercase tracking-[0.08em] text-slate">
              {complete ? "Complete" : processing ? "Running" : step.phase}
            </span>
          </span>
          {isActive ? (
            <span className="mt-1.5 block pl-7 text-caption text-slate">{step.summary}</span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

function Node({
  isActive,
  isLocked,
  complete,
  processing,
}: {
  isActive: boolean;
  isLocked: boolean;
  complete: boolean;
  processing: boolean;
}) {
  const base =
    "flex size-6 shrink-0 items-center justify-center rounded-full border text-note font-mono";

  if (isLocked) {
    return (
      <span className={cn(base, "border-stone bg-paper text-slate")} aria-hidden="true">
        <Lock className="size-3" />
      </span>
    );
  }

  if (complete) {
    return (
      <span className={cn(base, "border-forest bg-forest text-white")} aria-hidden="true">
        <Check className="size-3.5" />
      </span>
    );
  }

  if (processing) {
    return (
      <span className={cn(base, "ak-shimmer border-forest text-forest")} aria-hidden="true" />
    );
  }

  return (
    <span
      className={cn(
        base,
        isActive ? "border-forest bg-surface text-forest" : "border-stone bg-surface text-slate",
      )}
      aria-hidden="true"
    >
      ●
    </span>
  );
}

function StepperChip({
  step,
  index,
  isActive,
  status,
  disabled,
  onSelect,
}: {
  step: StepDefinition;
  index: number;
  isActive: boolean;
  status: StageStatus;
  disabled: boolean;
  onSelect: () => void;
}) {
  const isLocked = step.availability === "locked";
  const complete = status === "complete";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-current={isActive ? "step" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-xs border px-2.5 py-1.5 text-note transition-colors",
        isActive
          ? "border-forest bg-forest text-white"
          : "border-stone bg-surface text-ink/75",
        disabled && "cursor-not-allowed opacity-45",
        !disabled && !isActive && "hover:bg-paper",
      )}
    >
      {isLocked ? (
        <Lock className="size-3" aria-hidden="true" />
      ) : complete ? (
        <Check className="size-3 text-forest" aria-hidden="true" />
      ) : (
        <span className="font-mono text-note text-slate">{index + 1}</span>
      )}
      <span className="whitespace-nowrap">{step.title}</span>
    </button>
  );
}

export type { StepId };