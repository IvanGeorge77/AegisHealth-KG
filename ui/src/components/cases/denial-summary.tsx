import { FileText, Quote } from "lucide-react";

import { CarcBadge } from "@/components/common/status";
import { formatDate } from "@/lib/format";
import type { CaseRecord, DenialSummary } from "@/types/domain";

/* ============================================================================
   Denial summary
   ----------------------------------------------------------------------------
   The insurer's stated position, in its own words, with the codes read off the
   letter. Everything here is a FACT extracted from the document.

   Interpretation — what the denial means, whether it holds up, what to do about
   it — belongs to the requirement checklist and the evidence trail below. The
   boundary is deliberate and is labelled on the surface itself, because a
   reader must be able to tell at a glance which sentences are the payer's and
   which are ours.
   ========================================================================= */

export function DenialSummaryPanel({
  record,
  summary,
  className,
}: {
  record: CaseRecord;
  summary: DenialSummary | null;
  className?: string;
}) {
  return (
    <section aria-labelledby="denial-summary" className={className}>
      <PanelHeading
        id="denial-summary"
        title="Denial summary"
        provenance="Extracted from the denial letter"
      />

      <div className="rounded-xs border border-stone bg-surface">
        {/* Stated reason — quoted, not paraphrased. */}
        <div className="px-5 py-4">
          <p className="ak-label mb-2">As stated by the payer</p>
          {summary?.statedReason ? (
            <blockquote className="border-l-2 border-denial/50 pl-4">
              <p className="font-serif text-[1.0625rem] leading-relaxed text-ink">
                {summary.statedReason}
              </p>
              {summary.citation ? (
                <footer className="ak-mono mt-2.5 text-note text-slate">
                  {summary.citation}
                </footer>
              ) : null}
            </blockquote>
          ) : (
            <p className="text-caption italic text-slate">
              No denial letter has been supplied for this case, so there is nothing to
              summarise.
            </p>
          )}
        </div>

        {/* Fact grid */}
        <dl className="grid gap-x-8 gap-y-3 border-t border-stone px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
          <Fact label="Denial reason code">
            <CarcBadge code={record.carcCode} />
          </Fact>
          <Fact label="Category" mono>
            {record.denialCategory}
          </Fact>
          <Fact label="Claim ID" mono>
            {summary?.claimId ?? "—"}
          </Fact>
          <Fact label="Payer" >
            {summary?.payerName ?? record.payerName}
          </Fact>
          <Fact label="Policy ID" mono>
            {summary?.policyId ?? "—"}
          </Fact>
          <Fact label="Date of service">
            {record.serviceDate ? formatDate(record.serviceDate) : "—"}
          </Fact>
        </dl>

        {/* Diagnosis + procedure as billed */}
        <div className="grid gap-x-8 gap-y-3 border-t border-stone px-5 py-4 sm:grid-cols-2">
          <div>
            <p className="ak-label mb-1.5">Diagnosis</p>
            <p className="ak-mono text-ink">
              {record.diagnoses.length > 0 ? record.diagnoses.join(" · ") : "Not stated"}
            </p>
          </div>
          <div>
            <p className="ak-label mb-1.5">Procedure</p>
            <p className="text-caption text-ink">{record.service}</p>
          </div>
        </div>

        {/* The interpretation boundary, stated once and clearly. */}
        <p className="flex items-start gap-2 border-t border-stone bg-paper/60 px-5 py-3 text-note text-slate">
          <FileText className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Everything above is read from the letter. No inference has been applied. What the
            denial rests on is assessed in the requirement checklist.
          </span>
        </p>
      </div>
    </section>
  );
}

function Fact({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="ak-label mb-1">{label}</dt>
      <dd
        className={
          mono
            ? "ak-mono break-words text-ink"
            : "break-words text-caption text-ink"
        }
      >
        {children}
      </dd>
    </div>
  );
}

/** Shared heading used by each panel in the analysis workspace. */
export function PanelHeading({
  id,
  title,
  provenance,
  trailing,
}: {
  id: string;
  title: string;
  /** Where the panel's content comes from. Always stated. */
  provenance?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <div className="flex items-baseline gap-2.5">
        <h3 id={id} className="font-sans text-[0.9375rem] font-semibold text-ink">
          {title}
        </h3>
        {provenance ? (
          <span className="flex items-center gap-1.5 text-note text-slate">
            <Quote className="size-3" aria-hidden="true" />
            {provenance}
          </span>
        ) : null}
      </div>
      {trailing}
    </div>
  );
}