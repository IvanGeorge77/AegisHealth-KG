import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { PageBody, PageHeader } from "@/components/layout/page";
import { usePageMeta } from "@/components/layout/page-context";
import { PipelineStepper } from "@/components/pipeline/pipeline-stepper";
import { StepShell } from "@/components/pipeline/step-shell";
import { StepUpload } from "@/components/pipeline/steps/step-upload";
import { StepExtraction } from "@/components/pipeline/steps/step-extraction";
import { StepGraphReasoning } from "@/components/pipeline/steps/step-graph-reasoning";
import { StepEvidenceSearch } from "@/components/pipeline/steps/step-evidence-search";
import { StepAppealLetter } from "@/components/pipeline/steps/step-appeal-letter";
import { StepFhirPayload } from "@/components/pipeline/steps/step-fhir-payload";
import { usePipeline, type StepId } from "@/state/pipeline";
import { findCase, findCaseDetails } from "@/data/demo";

/* ============================================================================
   Processing pipeline
   ----------------------------------------------------------------------------
   Left: persistent progress stepper.
   Right: the stage currently selected in the pipeline store.

   Kept separate from the case-analysis workspace because the two jobs are
   different: this one ingests documents and extracts entities, the other
   reviews what that produced.
   ========================================================================= */

export function CaseWorkspacePage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { activeStep } = usePipeline();

  const record = caseId ? findCase(caseId) : null;
  const summary = record ? findCaseDetails(record.id)?.denialSummary : undefined;

  usePageMeta({
    title: "Pipeline",
    crumbs: [
      { label: "Cases", to: "/cases" },
      ...(record
        ? [{ label: record.reference, to: `/cases/${record.id}` }]
        : [{ label: "New case" }]),
    ],
  });

  return (
    <PageBody>
      <PageHeader
        eyebrow="Processing"
        title="Pipeline"
        description="Ingest a denial letter, extract its entities, then follow the reasoning and drafting stages. Stages beyond entity extraction have no backend endpoint yet."
        actions={
          caseId ? (
            <Link
              to={`/cases/${caseId}`}
              className="flex items-center gap-1.5 text-note text-slate transition-colors hover:text-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back to case analysis
            </Link>
          ) : (
            <Link
              to="/cases"
              className="flex items-center gap-1.5 text-note text-slate transition-colors hover:text-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              All cases
            </Link>
          )
        }
      />

      {/* The payer's stated position, kept in view while the stages run. */}
      {summary ? (
        <div className="mb-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <p className="ak-label mb-2">Stated denial reason</p>
            <blockquote className="border-l-2 border-denial/50 pl-4 font-serif text-[1.0625rem] leading-relaxed text-ink">
              {summary.statedReason}
            </blockquote>
            {summary.citation ? (
              <p className="ak-mono mt-2.5 pl-4 text-note text-slate">
                {summary.citation}
              </p>
            ) : null}
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-note lg:grid-cols-1">
            {[
              ["CARC code", summary.carcCode],
              ["Claim ID", summary.claimId],
              ["Policy ID", summary.policyId],
              ["Payer", summary.payerName],
            ]
              .filter(([, value]) => Boolean(value))
              .map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-2">
                  <dt className="ak-label">{label}</dt>
                  <dd className="ak-mono truncate text-ink">{value}</dd>
                </div>
              ))}
          </dl>
        </div>
      ) : null}

      {/* Stepper + active stage */}
      <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <p className="ak-label mb-3">Stages</p>
          <PipelineStepper />
        </aside>

        <div className="min-w-0">
          <ActiveStage stepId={activeStep} />
        </div>
      </div>
    </PageBody>
  );
}

/** Renders the stage matching the store's active step. */
function ActiveStage({ stepId }: { stepId: StepId }) {
  switch (stepId) {
    case "upload":
      return (
        <StepShell stepId="upload">
          <StepUpload />
        </StepShell>
      );
    case "extraction":
      return (
        <StepShell stepId="extraction">
          <StepExtraction />
        </StepShell>
      );
    case "graph":
      return (
        <StepShell stepId="graph">
          <StepGraphReasoning />
        </StepShell>
      );
    case "evidence":
      return (
        <StepShell stepId="evidence">
          <StepEvidenceSearch />
        </StepShell>
      );
    case "appeal":
      return (
        <StepShell stepId="appeal">
          <StepAppealLetter />
        </StepShell>
      );
    case "fhir":
      return (
        <StepShell stepId="fhir">
          <StepFhirPayload />
        </StepShell>
      );
    default:
      return null;
  }
}