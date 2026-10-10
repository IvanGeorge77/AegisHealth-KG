import { useState } from "react";
import { AlertCircle, Loader2, ScanLine, Tags } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/common/placeholders";
import { useDataSource } from "@/state/data-source";
import { cn } from "@/lib/cn";
import { usePipeline } from "@/state/pipeline";
import type { EntitySpan, ExtractedEntities } from "@/types/api";

/* ============================================================================
   Step 2 — Entity Extraction   (Phase 5 · backend implemented)
   ----------------------------------------------------------------------------
   Calls: POST /api/v1/documents/{document_id}/extract
   Returns: ExtractionResponse { document_id, filename, entities,
                                  raw_entity_count }

   `entities` contains three lists of EntitySpan (ICD-10, CPT, CARC) and five
   scalar identifiers. Each EntitySpan carries its own provenance (`regex`,
   `ner_model`, `both`) and character offsets, which are shown per chip — an
   extracted value without provenance is not evidence.
   ========================================================================= */

export function StepExtraction() {
  const { extraction, statuses, errors, runExtraction, upload } = usePipeline();
  const { mode } = useDataSource();
  const [useModel, setUseModel] = useState(false);

  const busy = statuses.extraction === "processing";
  const entities = extraction?.entities;

  return (
    <div className="space-y-6">
      {/* Run bar */}
      <div className="flex flex-col gap-4 rounded-xs border border-stone bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="ak-label">Extraction pipeline</p>
          <p className="mt-1 text-caption text-slate">
            {upload ? (
              <>
                Reads{" "}
                <span className="ak-mono text-ink">{upload.filename}</span> from document{" "}
                <span className="ak-mono text-ink">{upload.document_id}</span>.
              </>
            ) : (
              "No document has been uploaded yet."
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-4">
          <label className="flex cursor-pointer items-start gap-2 text-caption text-slate">
            <input
              type="checkbox"
              checked={useModel}
              onChange={(event) => setUseModel(event.target.checked)}
              disabled={busy}
              className="mt-0.5 size-3.5 accent-[#315C48]"
            />
            <span className="max-w-[22ch]">
              Include HuggingFace NER model
              <span className="block text-note text-slate">
                slower · ~400 MB first-run download
              </span>
            </span>
          </label>

          <Button
            onClick={() => runExtraction(useModel)}
            disabled={!upload || busy}
            className="whitespace-nowrap"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Extracting entities…
              </>
            ) : (
              <>
                <ScanLine className="size-4" aria-hidden="true" />
                {extraction ? "Re-run extraction pipeline" : "Run extraction pipeline"}
              </>
            )}
          </Button>
        </div>
      </div>

      {errors.extraction ? (
        <Notice tone="rust" title="Extraction failed" icon={AlertCircle}>
          <p>{errors.extraction}</p>
        </Notice>
      ) : null}

      {busy ? (
        <ProcessingPanel documentId={upload?.document_id} />
      ) : entities && extraction ? (
        <EntityGrid entities={entities} documentId={extraction.document_id} total={extraction.raw_entity_count} />
      ) : (
        <Notice tone="neutral" icon={Tags}>
          <p>
            No entities extracted yet. Running the pipeline calls the API and populates this
            grid. Nothing is inferred or pre-filled in the meantime.
          </p>
          <p className="ak-mono mt-1.5 text-note">
            POST /api/v1/documents/{"{document_id}"}/extract ·{" "}
            {mode === "mock" ? "mock transport" : "http://localhost:8000"}
          </p>
        </Notice>
      )}
    </div>
  );
}

/* ── Loading state ──────────────────────────────────────────────────────── */

function ProcessingPanel({ documentId }: { documentId?: string }) {
  const stages = [
    "Read stored extraction result",
    "Regex pass over billing and administrative identifiers",
    "Normalise codes (ICD-10, CPT/HCPCS, CARC)",
    "Assemble entity spans with character offsets",
  ];

  return (
    <div className="rounded-xs border border-stone bg-surface">
      <div className="border-b border-stone px-5 py-3">
        <p className="ak-label">Processing</p>
        {documentId ? (
          <p className="ak-mono mt-1 truncate text-slate">{documentId}</p>
        ) : null}
      </div>
      <ul className="divide-y divide-stone/70">
        {stages.map((stage, index) => (
          <li key={stage} className="flex items-center gap-3 px-5 py-3">
            <span className="ak-mono w-4 text-slate">{index + 1}</span>
            <span className="text-caption text-ink">{stage}</span>
            <span
              className="ak-shimmer ml-auto h-2 w-16 rounded-xs"
              style={{
                animationDelay: `${index * 140}ms`,
              }}
              aria-hidden="true"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Result grid ────────────────────────────────────────────────────────── */

function EntityGrid({
  entities,
  documentId,
  total,
}: {
  entities: ExtractedEntities;
  documentId: string;
  total: number;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-stone pb-3">
        <p className="text-caption text-slate">
          <span className="ak-mono text-ink">{total}</span> entities extracted from{" "}
          <span className="ak-mono text-ink">{documentId}</span>
        </p>
        <Badge tone="forest" size="md">
          Extraction complete
        </Badge>
      </div>

      {/* Code families */}
      <div className="grid gap-5 lg:grid-cols-3">
        <CodeGroup
          title="ICD-10 codes"
          description="Diagnoses cited in the document"
          spans={entities.icd10_codes}
        />
        <CodeGroup
          title="CPT codes"
          description="Procedures billed or denied"
          spans={entities.cpt_codes}
        />
        <CodeGroup
          title="CARC denial codes"
          description="Industry-standard adjustment reasons"
          spans={entities.denial_codes}
        />
      </div>

      {/* Administrative identifiers */}
      <section>
        <p className="ak-label mb-3">Administrative identifiers</p>
        <div className="grid gap-px overflow-hidden rounded-xs border border-stone bg-stone sm:grid-cols-2 lg:grid-cols-3">
          <IdentifierCard label="Payer name" value={entities.payer_name} />
          <IdentifierCard label="Provider NPI" value={entities.provider_npi} mono />
          <IdentifierCard label="Member ID" value={entities.member_id} mono />
          <IdentifierCard label="Claim ID" value={entities.claim_id} mono />
          <IdentifierCard label="Policy ID" value={entities.policy_id} mono className="sm:col-span-2 lg:col-span-3" />
        </div>
      </section>

      <Notice tone="neutral">
        These values were read directly from the uploaded document. They are extraction
        results, not verified facts — a code appearing in a letter does not by itself
        establish that the service was medically necessary or that it is covered.
      </Notice>
    </div>
  );
}

function CodeGroup({
  title,
  description,
  spans,
}: {
  title: string;
  description: string;
  spans: EntitySpan[];
}) {
  return (
    <section className="flex flex-col rounded-xs border border-stone bg-surface">
      <div className="border-b border-stone px-4 py-2.5">
        <p className="ak-label">{title}</p>
        <p className="mt-0.5 text-note text-slate">{description}</p>
      </div>

      {spans.length === 0 ? (
        <p className="px-4 py-4 text-caption italic text-slate">
          None found in this document.
        </p>
      ) : (
        <ul className="flex flex-1 flex-wrap gap-2 p-4">
          {spans.map((span, index) => (
            <li key={`${span.normalized}-${index}`}>
              <EntityChip span={span} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EntityChip({ span }: { span: EntitySpan }) {
  const normalised = span.normalized !== span.text;
  return (
    <span className="inline-flex items-center gap-2 rounded-xs border border-stone bg-paper px-2 py-1">
      <span className="ak-mono text-ink">{span.normalized}</span>
      {normalised ? (
        <span className="ak-mono text-slate line-through decoration-slate/50">
          {span.text}
        </span>
      ) : null}
      <span
        className="font-mono text-note uppercase tracking-[0.06em] text-slate"
        title={`Found by: ${span.source}${
          span.start_char !== null ? ` · chars ${span.start_char}–${span.end_char}` : ""
        }`}
      >
        {span.source}
      </span>
    </span>
  );
}

function IdentifierCard({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
  className?: string;
}) {
  const present = value !== null && value !== "";

  return (
    <div className={cn("bg-surface px-4 py-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="ak-label">{label}</p>
        <span
          className={cn(
            "font-mono text-note uppercase tracking-[0.06em]",
            present ? "text-forest" : "text-denial",
          )}
        >
          {present ? "found" : "absent"}
        </span>
      </div>
      <p
        className={cn(
          "mt-1 break-words text-[0.9375rem]",
          mono ? "ak-mono" : "font-medium",
          present ? "text-ink" : "text-slate italic",
        )}
      >
        {present ? value : "Not present in this document"}
      </p>
    </div>
  );
}