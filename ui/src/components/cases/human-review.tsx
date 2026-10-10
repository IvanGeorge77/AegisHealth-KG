import { useState } from "react";
import { Check, CircleDot, Info, RotateCcw, UserCheck } from "lucide-react";

import { PanelHeading } from "@/components/cases/denial-summary";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { CaseRecord } from "@/types/domain";

/* ============================================================================
   Human review
   ----------------------------------------------------------------------------
   The decision point of the workspace. Automated stages gather and organise
   material; a qualified person decides what it means and what happens next.

   State here is session-local. There is no review endpoint in the backend, so
   nothing is persisted and nothing is sent anywhere — the panel says so
   explicitly rather than letting a reviewer believe a decision was filed.
   ========================================================================= */

type ReviewDecision = "none" | "proceed" | "blocked";

export function HumanReviewPanel({
  record,
  openRequirements,
}: {
  record: CaseRecord;
  /** Number of requirements that are not verified. */
  openRequirements: number;
}) {
  const [decision, setDecision] = useState<ReviewDecision>("none");
  const [assigned, setAssigned] = useState(record.assignee !== "Unassigned");

  const blockers = record.missingDocuments.length + openRequirements;
  const canProceed = blockers === 0;

  return (
    <section aria-labelledby="human-review">
      <PanelHeading
        id="human-review"
        title="Reviewer decision"
        provenance="Requires a qualified person"
      />

      <div className="rounded-xs border border-stone bg-surface">
        {/* Readiness */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-stone px-5 py-3.5">
          <span className="ak-label">Readiness</span>
          {canProceed ? (
            <span className="flex items-center gap-1.5 text-note font-medium text-forest">
              <Check className="size-3.5" aria-hidden="true" />
              All requirements verified
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-note font-medium text-denial">
              <CircleDot className="size-3.5" aria-hidden="true" />
              {blockers} {plural(blockers)} outstanding
            </span>
          )}
        </div>

        {/* Ownership */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-stone px-5 py-3.5">
          <span className="ak-label">Assignee</span>
          <span className="ak-mono text-ink">
            {assigned ? record.assignee : "Unassigned"}
          </span>
          <Button
            variant="secondary"
            size="sm"
            className="ml-auto"
            onClick={() => setAssigned((value) => !value)}
          >
            <UserCheck className="size-3.5" aria-hidden="true" />
            {assigned ? "Reassign" : "Assign to me"}
          </Button>
        </div>

        {/* Decision */}
        <div className="px-5 py-4">
          <p className="ak-label mb-1.5">Decision</p>
          <p className="mb-3 text-note leading-relaxed text-slate">
            Record what should happen next. Nothing here changes the payer record; it tells
            the rest of the team whether this case can move.
          </p>

          <div className="flex flex-wrap gap-2">
            <DecisionButton
              active={decision === "proceed"}
              disabled={!canProceed}
              onClick={() => setDecision("proceed")}
            >
              Proceed to drafting
            </DecisionButton>
            <DecisionButton
              active={decision === "blocked"}
              onClick={() => setDecision("blocked")}
            >
              Blocked — request documents
            </DecisionButton>
            <DecisionButton
              active={decision === "none"}
              onClick={() => setDecision("none")}
            >
              Defer
            </DecisionButton>

            {decision !== "none" ? (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setDecision("none")}
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Clear
              </Button>
            ) : null}
          </div>

          {decision === "proceed" && !canProceed ? (
            <p className="mt-3 text-note text-denial">
              This case still has {plural(blockers)} outstanding. Clear them before marking it
              ready to proceed.
            </p>
          ) : null}

          {decision !== "none" ? (
            <p
              className={cn(
                "mt-3 text-note",
                decision === "proceed" ? "text-forest" : "text-slate",
              )}
              role="status"
            >
              Recorded for this session:{" "}
              <span className="font-medium">
                {decision === "proceed"
                  ? "proceed to drafting"
                  : decision === "blocked"
                    ? "blocked pending documents"
                    : "deferred"}
              </span>
              .
            </p>
          ) : null}
        </div>

        {/* Honesty about persistence */}
        <p className="flex items-start gap-2 border-t border-stone bg-paper/60 px-5 py-3 text-note leading-relaxed text-slate">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            No review endpoint exists in the backend. Decisions and assignments made here
            are held in this browser session only and are discarded on reload.
          </span>
        </p>
      </div>
    </section>
  );
}

function DecisionButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "rounded-xs border px-3 py-1.5 text-note transition-colors",
        active
          ? "border-forest bg-forest text-white"
          : "border-stone bg-surface text-slate hover:text-ink",
        disabled && "cursor-not-allowed opacity-45 hover:text-slate",
      )}
    >
      {children}
    </button>
  );
}

function plural(count: number): string {
  return count === 1 ? "item" : "items";
}