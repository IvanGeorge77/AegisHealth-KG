import { Braces, Copy, Download } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/common/placeholders";

/* ============================================================================
   Step 6 — FHIR Payload   (Phase 11 · NOT IMPLEMENTED)
   ----------------------------------------------------------------------------
   Future endpoint: src/aegis/api/routes/fhir.py (does not exist yet)
   Backed by: src/aegis/models/fhir_models.py.

   Success criterion (docs/SCOPE.md): the emitted bundle must pass FHIR R4
   schema validation. Until that endpoint exists and validates, no payload is
   shown here — a syntactically plausible JSON block that has never been
   validated would misrepresent the state of the system.
   ========================================================================= */

/** Resource types the bundle is expected to contain, as a structural checklist. */
const EXPECTED_RESOURCES = [
  { type: "Bundle", note: "type = collection, entry[]" },
  { type: "Patient", note: "pseudonymous identifier only" },
  { type: "Coverage", note: "payer, subscriber, member id" },
  { type: "Claim", note: "status, diagnosis reference, total" },
  { type: "ClaimResponse", note: "error[] with CARC code + reason" },
  { type: "ExplanationOfBenefit", note: "outcome, reason codes" },
  { type: "Condition", note: "ICD-10 coding" },
  { type: "Procedure", note: "CPT/HCPCS coding" },
  { type: "Provenance", note: "links each assertion to its source document" },
];

export function StepFhirPayload() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    // Nothing to copy while the endpoint is unimplemented — the control below
    // is disabled, so this only guards against future misuse.
    setCopied(false);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-stone pb-4">
        <div className="min-w-0">
          <p className="ak-label mb-1.5 flex items-center gap-2">
            <span>Phase 11</span>
            <span aria-hidden="true" className="h-px w-4 bg-stone" />
            <span>Pending</span>
          </p>
          <h2 className="text-[1.375rem] leading-tight">FHIR Payload</h2>
          <p className="mt-1.5 max-w-[62ch] text-caption text-slate">
            A machine-readable FHIR R4 bundle carrying the claim, the denial reason and every
            assertion, each linked back to the document it came from. Not yet implemented.
          </p>
        </div>
        <Badge tone="ochre" size="md">
          Coming soon
        </Badge>
      </header>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Code block */}
        <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-xs border border-stone bg-surface">
          <header className="flex items-center gap-2 border-b border-stone px-4 py-2">
            <Braces className="size-3.5 text-slate" aria-hidden="true" />
            <span className="ak-label">Machine-readable FHIR JSON bundle</span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled
                onClick={handleCopy}
                aria-label="Copy payload"
                title="Unavailable until the FHIR endpoint is implemented"
              >
                <Copy className="size-3.5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled
                aria-label="Download payload"
                title="Unavailable until the FHIR endpoint is implemented"
              >
                <Download className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </header>

          <div
            className="ak-scroll flex-1 bg-[#fbfaf6] px-5 py-4 font-mono text-[0.8125rem] leading-relaxed"
            tabIndex={0}
            role="region"
            aria-label="FHIR JSON bundle, scrollable"
          >
            {copied ? null : (
              <pre className="whitespace-pre text-slate">
{`{
  "resourceType": "Bundle",
  "type": "collection",

  "_comment": [
    "No payload is displayed.",
    "The FHIR endpoint (Phase 11) is not implemented and its",
    "output has not been validated against the FHIR R4 schema.",
    "Showing an unvalidated example here would misrepresent the",
    "state of the system."
  ],

  "entry": [ /* await /api/v1/fhir/{document_id} */ ]
}`}
              </pre>
            )}
          </div>
        </section>

        {/* Expected resources */}
        <aside className="space-y-4">
          <div className="rounded-xs border border-stone bg-surface">
            <p className="ak-label border-b border-stone px-4 py-2.5">
              Expected resources
            </p>
            <ul className="divide-y divide-stone/70">
              {EXPECTED_RESOURCES.map((resource) => (
                <li key={resource.type} className="px-4 py-2">
                  <p className="ak-mono text-ink">{resource.type}</p>
                  <p className="text-note text-slate">{resource.note}</p>
                </li>
              ))}
            </ul>
          </div>

          <Notice tone="neutral" title="Validation gate">
            <p>
              Acceptance for this stage is schema validation against FHIR R4 — not a
              well-formed-looking document. The gate is stated here so the stage cannot be
              marked complete on appearance alone.
            </p>
          </Notice>
        </aside>
      </div>
    </div>
  );
}