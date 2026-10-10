import { GitBranch, ListChecks } from "lucide-react";

import { LockedPanel, EmptyContainer } from "@/components/common/placeholders";
import { requirementsFor } from "@/data/demo";

/* ============================================================================
   Step 3 — Graph Reasoning   (Phase 6 · NOT IMPLEMENTED)
   ----------------------------------------------------------------------------
   Future endpoint: src/aegis/api/routes/retrieval.py (does not exist yet)
   Backed by: src/aegis/graph/retrieval.py over Neo4j.

   Two-column structure per the phase plan:
     left  — Policy rules & missing criteria, derived from deterministic
             multi-hop traversal of the knowledge graph
     right — Interactive Neo4j subgraph visualisation with relationship labels

   The requirement rows below are STRUCTURAL only. They are demonstration
   values from data/demo.ts and are explicitly labelled as such. No graph
   traversal has been performed on the uploaded document.
   ========================================================================= */

export function StepGraphReasoning() {
  return (
    <LockedPanel
      phase="Phase 6"
      title="Graph Reasoning"
      description="Deterministic multi-hop traversal of the knowledge graph to identify which payer requirements the case satisfies and which it does not. Not yet implemented."
      contract={[
        "Endpoint: POST /api/v1/retrieval/graph",
        "Store: Neo4j (bolt://localhost:7687)",
        "Output: GraphPath { requirements[], missing[], edges[] }",
      ]}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Left — policy rules & missing criteria */}
        <section
          aria-label="Policy rules and missing criteria — placeholder"
          className="flex flex-col overflow-hidden rounded-xs border border-dashed border-stone bg-surface"
        >
          <header className="flex items-center gap-2 border-b border-dashed border-stone px-4 py-2.5">
            <ListChecks className="size-3.5 text-slate" aria-hidden="true" />
            <h3 className="ak-label">Policy rules &amp; missing criteria</h3>
          </header>

          <p className="border-b border-stone bg-ochre-soft/50 px-4 py-2 text-note text-[#7a5d26]">
            Illustrative structure only — not derived from your uploaded document.
          </p>

          <ul className="divide-y divide-stone/70">
            {requirementsFor("aeg-2024-0147").map((requirement) => (
              <li key={requirement.id} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="ak-mono text-slate">{requirement.id}</p>
                  <span className="font-mono text-note uppercase tracking-[0.06em] text-slate">
                    order {requirement.order || "—"}
                  </span>
                </div>
                <p className="mt-1 text-[0.875rem] font-medium text-ink">
                  {requirement.description}
                </p>
                <p className="mt-1 text-caption text-slate">{requirement.evidenceRequired}</p>
                <p className="ak-mono mt-1.5 text-note text-slate">
                  {requirement.citation}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-auto border-t border-dashed border-stone px-4 py-3">
            <p className="text-caption italic text-slate">
              Each row will carry a review status, a supporting evidence reference and an
              inspect action once Phase 6 is built.
            </p>
          </div>
        </section>

        {/* Right — subgraph visualisation */}
        <EmptyContainer
          label="Interactive Neo4j subgraph"
          icon={GitBranch}
          hint="Node types: Patient, Diagnosis, Procedure, PolicyRule, Requirement, Payer, Statute. Edges: INDICATED_FOR, COVERED_BY, REQUIRES, PRECEDES, ISSUED, REFERENCES_STATUTE."
          rows={5}
          className="min-h-[24rem]"
        />
      </div>
    </LockedPanel>
  );
}