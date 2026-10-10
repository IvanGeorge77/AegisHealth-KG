import { ExternalLink, Quote, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyContainer } from "@/components/common/placeholders";
import { allEvidence, allRequirements } from "@/data/demo";

const DEMO_EVIDENCE = allEvidence();

/* ============================================================================
   Step 4 — Medical Evidence Search   (Phase 7 · NOT IMPLEMENTED)
   ----------------------------------------------------------------------------
   Future endpoint: src/aegis/api/routes/retrieval.py (does not exist yet)
   Backed by: FAISS index + MedEmbed embeddings, built by
              scripts/index_pubmed.py.

   Grounding rule from docs/SCOPE.md: an abstract may only be cited for what it
   actually says. Excerpts below are placeholder strings, explicitly marked,
   and every card carries the requirement it would support so relevance stays
   auditable rather than implied by ranking alone.
   ========================================================================= */

export function StepEvidenceSearch() {
  const requirementLabel = (id?: string) =>
    allRequirements().find((r) => r.id === id)?.id ?? null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-stone pb-4">
        <div className="min-w-0">
          <p className="ak-label mb-1.5 flex items-center gap-2">
            <span>Phase 7</span>
            <span aria-hidden="true" className="h-px w-4 bg-stone" />
            <span>Pending</span>
          </p>
          <h2 className="text-[1.375rem] leading-tight">Medical Evidence Search</h2>
          <p className="mt-1.5 max-w-[62ch] text-caption text-slate">
            Vector retrieval over indexed PubMed abstracts, ranked against each unmet payer
            requirement. Not yet implemented.
          </p>
        </div>
        <Badge tone="ochre" size="md">
          Coming soon
        </Badge>
      </header>

      <p className="ak-mono mt-3 text-note text-slate">
        Endpoint: POST /api/v1/retrieval/evidence · index: data/faiss_index
      </p>

      <section className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xs border border-dashed border-stone bg-surface">
        <header className="flex items-center gap-2 border-b border-dashed border-stone px-4 py-2.5">
          <Search className="size-3.5 text-slate" aria-hidden="true" />
          <h3 className="ak-label">Retrieved PubMed abstracts</h3>
          <span className="ml-auto font-mono text-note uppercase tracking-[0.06em] text-slate">
            {DEMO_EVIDENCE.length} placeholder records
          </span>
        </header>

        <p className="border-b border-stone bg-ochre-soft/50 px-4 py-2 text-note text-[#7a5d26]">
          Illustrative structure only. Titles, authors and DOIs below are fabricated and do not
          resolve to real publications.
        </p>

        <ul className="divide-y divide-stone/70">
          {DEMO_EVIDENCE.map((item) => (
            <li key={item.id} className="px-4 py-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[1rem] leading-snug text-ink">{item.title}</p>
                  <p className="mt-1 text-caption text-slate">
                    {item.authors} · <em>{item.journal}</em> · {item.year}
                  </p>
                  <p className="mt-0.5 text-note uppercase tracking-[0.06em] text-slate">
                    {item.publicationType}
                    {requirementLabel(item.supportsRequirementId)
                      ? ` · supports ${requirementLabel(item.supportsRequirementId)}`
                      : ""}
                  </p>
                </div>

                {item.relevance !== undefined ? (
                  <div className="shrink-0 text-right">
                    <p className="ak-label">relevance</p>
                    <p className="ak-mono text-ink">{item.relevance.toFixed(2)}</p>
                  </div>
                ) : null}
              </div>

              {item.excerpt ? (
                <p className="mt-2 flex gap-2 border-l-2 border-stone pl-3 text-caption italic text-slate">
                  <Quote className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                  {item.excerpt}
                </p>
              ) : null}

              <a
                href={`https://doi.org/${item.doi}`}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex items-center gap-1.5 font-mono text-note text-forest underline underline-offset-4 hover:text-forest-deep"
              >
                doi:{item.doi}
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-auto border-t border-dashed border-stone p-4">
          <EmptyContainer
            label="Query &amp; retrieval parameters"
            hint="Will show the embedding model, top-k, the query derived from the unmet requirement, and per-result similarity — so a reviewer can see why each abstract was retrieved."
            rows={2}
          />
        </div>
      </section>
    </div>
  );
}