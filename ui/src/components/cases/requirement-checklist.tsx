import { useState } from "react";
import { ChevronDown, ExternalLink, FileText } from "lucide-react";

import { RequirementStatusBadge } from "@/components/common/status";
import { PanelHeading } from "@/components/cases/denial-summary";
import { cn } from "@/lib/cn";
import type { Requirement } from "@/types/domain";

/* ============================================================================
   Requirement checklist
   ----------------------------------------------------------------------------
   Payer requirements as reviewable items, one per policy prerequisite.

   The rule this component exists to enforce: the presence of a document is not
   proof that a requirement is satisfied. Only `verified` may be shown as met,
   and it always carries the citation that proves it. Everything else is an open
   question for a human.

   Each row expands in place (progressive disclosure) rather than navigating
   away, so a reviewer working down the list never loses their position.
   ========================================================================= */

export function RequirementChecklist({
  requirements,
  policyId,
}: {
  requirements: Requirement[];
  policyId?: string;
}) {
  if (requirements.length === 0) {
    return (
      <PanelHeading id="requirements" title="Requirement checklist" />
    );
  }

  const verified = requirements.filter((r) => r.status === "verified").length;
  const open = requirements.length - verified;

  return (
    <section aria-labelledby="requirements">
      <PanelHeading
        id="requirements"
        title="Requirement checklist"
        provenance="From the payer's coverage policy"
        trailing={
          <p className="text-note text-slate">
            <span className="ak-mono text-forest">{verified}</span> verified ·{" "}
            <span className="ak-mono text-ochre">{open}</span> open
            {policyId ? (
              <>
                {" · "}
                <span className="ak-mono">{policyId}</span>
              </>
            ) : null}
          </p>
        }
      />

      <ul className="space-y-2">
        {requirements.map((requirement) => (
          <RequirementItem key={requirement.id} requirement={requirement} />
        ))}
      </ul>
    </section>
  );
}

function RequirementItem({ requirement }: { requirement: Requirement }) {
  const [open, setOpen] = useState(false);
  const panelId = `req-${requirement.id}`;

  return (
    <li className="ak-row overflow-hidden">
      <h4>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-start gap-4 px-4 py-3.5 text-left sm:px-5"
        >
          <ChevronDown
            className={cn(
              "mt-1 size-4 shrink-0 text-slate transition-transform duration-150",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <RequirementStatusBadge status={requirement.status} />
              <span className="ak-mono text-note text-slate">{requirement.id}</span>
              {requirement.order > 0 ? (
                <span className="text-note text-slate">step {requirement.order}</span>
              ) : null}
            </span>

            <span className="mt-1.5 block text-caption font-medium text-ink">
              {requirement.description}
            </span>

            {requirement.justification ? (
              <span className="mt-1 block text-note leading-relaxed text-slate">
                {requirement.justification}
              </span>
            ) : null}
          </span>
        </button>
      </h4>

      {open ? (
        <div
          id={panelId}
          className="border-t border-stone bg-paper/60 px-4 py-4 sm:px-5"
        >
          <dl className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
            <Detail label="Requirement type">{requirement.type}</Detail>
            <Detail label="Source citation" mono>
              {requirement.citation ?? "Not cited"}
            </Detail>
            <Detail label="Evidence required" className="sm:col-span-2">
              {requirement.evidenceRequired}
            </Detail>
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-stone pt-3.5">
            {requirement.evidenceRef ? (
              <span className="flex items-center gap-1.5 text-note text-slate">
                <FileText className="size-3.5 shrink-0" aria-hidden="true" />
                Supporting record:{" "}
                <span className="ak-mono text-ink">{requirement.evidenceRef}</span>
              </span>
            ) : (
              <span className="text-note text-denial">
                No supporting record on file for this requirement.
              </span>
            )}

            <button
              type="button"
              disabled
              className="ml-auto flex items-center gap-1.5 rounded-xs border border-stone bg-surface px-2.5 py-1 text-note text-slate opacity-60"
              title="Opens the source document at the cited passage. Available once document viewing is implemented."
            >
              Inspect evidence
              <ExternalLink className="size-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function Detail({
  label,
  children,
  mono,
  className,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="ak-label mb-1">{label}</dt>
      <dd className={cn("text-note leading-relaxed text-ink", mono && "ak-mono")}>
        {children}
      </dd>
    </div>
  );
}