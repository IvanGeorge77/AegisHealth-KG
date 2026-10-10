import { Download, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/common/placeholders";

/* ============================================================================
   Step 5 — Appeal Letter Generation   (Phase 10 · NOT IMPLEMENTED)
   ----------------------------------------------------------------------------
   Future endpoint: src/aegis/api/routes/appeals.py (does not exist yet)
   Backed by: src/aegis/appeal/generator.py + renderer.py.

   This panel must never imply an appeal will succeed, nor that a draft has
   been approved. A generated letter is a DRAFT requiring human verification
   before submission — the panel states that explicitly and the download
   control stays disabled until a real document exists.
   ========================================================================= */

export function StepAppealLetter() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-stone pb-4">
        <div className="min-w-0">
          <p className="ak-label mb-1.5 flex items-center gap-2">
            <span>Phase 10</span>
            <span aria-hidden="true" className="h-px w-4 bg-stone" />
            <span>Pending</span>
          </p>
          <h2 className="text-[1.375rem] leading-tight">Appeal Letter Generation</h2>
          <p className="mt-1.5 max-w-[62ch] text-caption text-slate">
            Language-model drafting of an evidence-backed appeal, grounded in the denial letter,
            payer policy passages and retrieved literature. Not yet implemented.
          </p>
        </div>
        <Badge tone="ochre" size="md">
          Coming soon
        </Badge>
      </header>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        {/* PDF viewer */}
        <div className="flex min-h-[34rem] flex-col overflow-hidden rounded-xs border border-stone bg-[#e9e5da]">
          <div className="flex items-center gap-2 border-b border-stone bg-surface px-4 py-2">
            <FileText className="size-3.5 text-slate" aria-hidden="true" />
            <span className="ak-label">Appeal letter · rendered preview</span>
            <span className="ml-auto font-mono text-note uppercase tracking-[0.06em] text-slate">
              PDF viewer
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-[46rem] bg-white px-12 py-14 shadow-[0_1px_3px_rgba(34,40,35,0.12)]">
              {/* Structural skeleton of the letter — no generated content. */}
              <div className="space-y-4">
                <div className="h-px w-full bg-stone" />
                <div className="space-y-2">
                  <div className="h-2 w-1/3 rounded-xs bg-stone/50" />
                  <div className="h-2 w-2/3 rounded-xs bg-stone/40" />
                </div>
                <div className="space-y-2 pt-4">
                  {["w-full", "w-11/12", "w-full", "w-4/5", "w-full", "w-3/5"].map((width, i) => (
                    <div
                      key={i}
                      className="h-2 rounded-xs bg-stone/35"
                      style={{ width }}
                    />
                  ))}
                </div>
                <div className="space-y-2 pt-4">
                  {["w-full", "w-full", "w-10/12"].map((width, i) => (
                    <div
                      key={i}
                      className="h-2 rounded-xs bg-stone/35"
                      style={{ width }}
                    />
                  ))}
                </div>
                <div className="space-y-2 pt-6">
                  <div className="h-3 w-40 rounded-xs bg-stone/60" />
                </div>
              </div>

              <p className="mt-10 text-center font-serif text-[0.9375rem] italic text-slate">
                No letter has been generated.
              </p>
            </div>
          </div>
        </div>

        {/* Actions + required sections */}
        <aside className="space-y-4">
          <div className="space-y-3 rounded-xs border border-stone bg-surface p-4">
            <Button block disabled>
              <Download className="size-4" aria-hidden="true" />
              Download PDF
            </Button>
            <p className="text-note text-slate">
              Disabled. The export endpoint does not exist yet, and no document has been
              produced.
            </p>
          </div>

          <div className="rounded-xs border border-stone bg-surface">
            <p className="ak-label border-b border-stone px-4 py-2.5">
              Required sections
            </p>
            <ol className="space-y-2 px-4 py-3 text-caption text-slate">
              {[
                "Administrative header & identifiers",
                "Denial reason as stated by the payer",
                "Clinical rebuttal, requirement by requirement",
                "Legal & regulatory citations",
                "Bibliography with resolvable sources",
              ].map((section, index) => (
                <li key={section} className="flex gap-2">
                  <span className="ak-mono text-slate">{index + 1}.</span>
                  <span>{section}</span>
                </li>
              ))}
            </ol>
          </div>

          <Notice tone="ochre" title="Draft only — human verification required">
            A generated appeal is a starting point for a qualified reviewer. Nothing in this
            product predicts or guarantees a payer's decision.
          </Notice>
        </aside>
      </div>
    </div>
  );
}