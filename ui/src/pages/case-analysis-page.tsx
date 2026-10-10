import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, GitBranch } from "lucide-react";

import { PageBody, PageHeader } from "@/components/layout/page";
import { usePageMeta } from "@/components/layout/page-context";
import { Button } from "@/components/ui/button";
import { CaseStatusBadge, CarcBadge } from "@/components/common/status";
import { Notice } from "@/components/common/placeholders";
import { DenialSummaryPanel } from "@/components/cases/denial-summary";
import { RequirementChecklist } from "@/components/cases/requirement-checklist";
import { EvidenceTrail } from "@/components/cases/evidence-trail";
import { CaseDocuments } from "@/components/cases/case-documents";
import { HumanReviewPanel } from "@/components/cases/human-review";
import { findCase, findCaseDetails } from "@/data/demo";
import { formatDate, pluralise } from "@/lib/format";

/* ============================================================================
   Case-analysis workspace
   ----------------------------------------------------------------------------
   The primary screen for reviewing a denial. Three areas, read in order:

     A. Denial summary    — what the payer said, in its own words
     B. Requirement checklist — what the policy demands and whether the record
                              answers it
     C. Evidence trail    — how (A) connects to (B) and to the source documents

   Plus the case record, outstanding document requests, and the reviewer
   decision that closes the loop.

   The processing pipeline lives alongside at /cases/:caseId/pipeline, because
   ingesting a document and reviewing its consequences are different jobs.
   ========================================================================= */

export function CaseAnalysisPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const record = findCase(caseId);
  const details = findCaseDetails(record.id);

  usePageMeta({
    title: "Case analysis",
    crumbs: [
      { label: "Cases", to: "/cases" },
      { label: record.reference },
    ],
  });

  const openRequirements = useMemo(
    () => details?.requirements.filter((r) => r.status !== "verified").length ?? 0,
    [details],
  );

  const missing = record.missingDocuments.length;
  const noRecord = record.documents.length === 0;

  return (
    <PageBody>
      {/* ── Case identity ─────────────────────────────────────────────── */}
      <PageHeader
        eyebrow={record.reference}
        title={record.title}
        description={record.service}
        actions={
          <Link to={`/cases/${record.id}/pipeline`}>
            <Button variant="secondary">
              <GitBranch className="size-4" aria-hidden="true" />
              Processing pipeline
            </Button>
          </Link>
        }
        meta={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <CaseStatusBadge status={record.status} />
            <CarcBadge code={record.carcCode} />
            <span className="text-note text-slate">{record.payerName}</span>
            <span aria-hidden="true" className="text-stone">
              ·
            </span>
            <span className="text-note text-slate">
              Member <span className="ak-mono text-ink">{record.memberId}</span>
            </span>
            <span aria-hidden="true" className="text-stone">
              ·
            </span>
            <span className="text-note text-slate">
              Assigned to <span className="text-ink">{record.assignee}</span>
            </span>
          </div>
        }
      />

      {/* ── Blocking state ─────────────────────────────────────────────── */}
      {noRecord ? (
        <Notice tone="rust" title="Nothing to analyse">
          <p>
            This case has no documents on file. An analysis cannot begin until the denial
            letter is received — there is nothing to read a reason from, and nothing to cite.
          </p>
          <Link
            to="/cases/new"
            className="mt-2 inline-flex items-center gap-1.5 text-caption font-medium text-forest underline underline-offset-4"
          >
            Upload the denial letter
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Notice>
      ) : null}

      {/* ── Main layout ────────────────────────────────────────────────── */}
      <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_21rem]">
        {/* Left: the analysis */}
        <div className="min-w-0 space-y-12">
          <DenialSummaryPanel
            record={record}
            // With no document on file there is no letter to quote, so the
            // summary states its absence rather than repeating a portal note.
            summary={noRecord ? null : (details?.denialSummary ?? null)}
          />

          {details ? (
            <RequirementChecklist
              requirements={details.requirements}
              policyId={details.policy.policyId}
            />
          ) : (
            <section aria-labelledby="requirements">
              <h3
                id="requirements"
                className="mb-3 font-sans text-[0.9375rem] font-semibold text-ink"
              >
                Requirement checklist
              </h3>
              <p className="rounded-xs border border-dashed border-stone bg-surface/60 px-5 py-6 text-center text-caption italic text-slate">
                No coverage policy has been matched to this case. Requirement evaluation runs
                against the knowledge graph, which is not implemented.
              </p>
            </section>
          )}

          {details ? (
            <EvidenceTrail
              trail={details.trail}
              documents={record.documents}
              evidence={details.evidence}
            />
          ) : null}
        </div>

        {/* Right: the record and the decision */}
        <aside className="space-y-10">
          <CaseDocuments
            documents={record.documents}
            missing={record.missingDocuments}
          />

          <HumanReviewPanel record={record} openRequirements={openRequirements} />

          <section>
            <h3 className="ak-label mb-3">Case facts</h3>
            <dl className="space-y-2.5">
              {[
                ["Reference", record.reference, true],
                ["Member ID", record.memberId, true],
                ["Payer", record.payerName, false],
                ["Policy", details?.policy.policyId ?? "Not matched", true],
                ["Diagnoses", record.diagnoses.join(" · ") || "Not stated", true],
                ["Date of service", formatDate(record.serviceDate), false],
                ["Documents", `${record.documents.length} on file`, false],
                ["Outstanding", `${missing} requested`, false],
                ["Last updated", formatDate(record.updatedAt), false],
              ].map(([label, value, mono]) => (
                <div
                  key={String(label)}
                  className="flex items-baseline justify-between gap-3 border-b border-stone/60 pb-2"
                >
                  <dt className="ak-label shrink-0">{label}</dt>
                  <dd
                    className={
                      mono
                        ? "ak-mono min-w-0 truncate text-right text-ink"
                        : "min-w-0 truncate text-right text-note text-ink"
                    }
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {record.title ? (
            <p className="text-note leading-relaxed text-slate">
              {record.documents.length}{" "}
              {pluralise(record.documents.length, "document")} and{" "}
              {details?.requirements.length ?? 0}{" "}
              {pluralise(details?.requirements.length ?? 0, "requirement")} in this case.
              Every figure above comes from the case record — none is inferred.
            </p>
          ) : null}
        </aside>
      </div>
    </PageBody>
  );
}