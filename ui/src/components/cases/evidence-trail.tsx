import { ExternalLink, Link2 } from "lucide-react";

import { PanelHeading } from "@/components/cases/denial-summary";
import { cn } from "@/lib/cn";
import type { CaseDocument, EvidenceItem, EvidenceLink } from "@/types/domain";

/* ============================================================================
   Evidence trail
   ----------------------------------------------------------------------------
   How the denial connects to a payer requirement and to the record that answers
   it. Each entry is one reasoning step, and each carries its source: the policy
   passage it relies on, the document it was read from, and the retrieved
   literature behind it.

   Progressive disclosure — the assertion is stated first and in full; the
   supporting references are one click away. A reviewer who wants the chain gets
   it without the chain dominating the page for someone who does not.

   Strength is conveyed by an icon and a word as well as colour, so it survives
   being printed or read by someone who cannot distinguish the tints.
   ========================================================================= */

const STRENGTH = {
  supported: {
    label: "Supported",
    dot: "bg-forest",
    text: "text-forest",
    note: "The record contains what the requirement asks for.",
  },
  missing: {
    label: "Gap",
    dot: "bg-denial",
    text: "text-denial",
    note: "Nothing in the record answers this step.",
  },
  contested: {
    label: "Unresolved",
    dot: "bg-ochre",
    text: "text-[#7a5d26]",
    note: "Sources disagree, or the record does not settle the question.",
  },
} as const;

export function EvidenceTrail({
  trail,
  documents,
  evidence,
}: {
  trail: EvidenceLink[];
  documents: CaseDocument[];
  evidence: EvidenceItem[];
}) {
  const documentById = new Map(documents.map((doc) => [doc.id, doc]));
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));

  return (
    <section aria-labelledby="evidence-trail">
      <PanelHeading
        id="evidence-trail"
        title="Evidence trail"
        provenance="Denial → requirement → record"
      />

      {trail.length === 0 ? (
        <p className="rounded-xs border border-dashed border-stone bg-surface/60 px-5 py-6 text-center text-caption italic text-slate">
          No reasoning has been recorded for this case.
        </p>
      ) : (
        <ol className="relative space-y-2">
          {trail.map((link, index) => {
            const strength = STRENGTH[link.strength];
            const document = link.documentId
              ? documentById.get(link.documentId)
              : undefined;
            const item = link.evidenceId ? evidenceById.get(link.evidenceId) : undefined;
            const isLast = index === trail.length - 1;

            return (
              <li key={link.id} className="relative">
                <div className="ak-row px-4 py-3.5 sm:px-5">
                  <div className="flex gap-3.5">
                    {/* Connector rail */}
                    <div className="flex shrink-0 flex-col items-center">
                      <span
                        className={cn(
                          "mt-1.5 size-2.5 shrink-0 rounded-full",
                          strength.dot,
                        )}
                        aria-hidden="true"
                      />
                      {!isLast ? (
                        <span
                          aria-hidden="true"
                          className="mt-1.5 w-px flex-1 bg-stone"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span
                          className={cn(
                            "text-note font-semibold uppercase tracking-[0.08em]",
                            strength.text,
                          )}
                        >
                          {strength.label}
                        </span>
                        {link.requirementId ? (
                          <span className="ak-mono text-note text-slate">
                            {link.requirementId}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-caption leading-relaxed text-ink">
                        {link.assertion}
                      </p>

                      {link.excerpt ? (
                        <p className="mt-2 border-l-2 border-stone pl-3 font-serif text-note italic leading-relaxed text-slate">
                          {link.excerpt}
                        </p>
                      ) : null}

                      {/* Sources */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <span className="text-note text-slate">{link.citation}</span>

                        {document ? (
                          <span className="flex items-center gap-1.5 text-note text-slate">
                            <Link2 className="size-3" aria-hidden="true" />
                            <span className="ak-mono text-ink">{document.filename}</span>
                            {document.pageCount ? (
                              <span className="text-slate">· {document.pageCount}p</span>
                            ) : null}
                          </span>
                        ) : null}

                        {item ? (
                          <a
                            href={`https://doi.org/${item.doi}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="flex items-center gap-1 font-mono text-note text-forest underline underline-offset-4 hover:text-forest-deep"
                          >
                            doi:{item.doi}
                            <ExternalLink className="size-3" aria-hidden="true" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Legend — the vocabulary the trail uses, so a step's weight is legible
          without inferring it from colour alone. */}
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5">
        {Object.entries(STRENGTH).map(([key, value]) => (
          <li key={key} className="flex items-center gap-2 text-note text-slate">
            <span className={cn("size-2 rounded-full", value.dot)} aria-hidden="true" />
            <span className="font-semibold uppercase tracking-[0.08em]">{value.label}</span>
            <span>{value.note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}