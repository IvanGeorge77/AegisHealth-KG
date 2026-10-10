import { Link } from "react-router-dom";
import { ArrowRight, CircleSlash, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

import { PageBody, PageHeader } from "@/components/layout/page";
import { usePageMeta } from "@/components/layout/page-context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

/* ============================================================================
   Screens awaiting a backend
   ----------------------------------------------------------------------------
   The information architecture includes these destinations, so they keep their
   routes and their place in the navigation. What they do NOT do is show content
   that has not been computed.

   Each one states, in the same order:
     1. What the screen is for
     2. Why it is not available — the specific missing endpoint
     3. Where the work lives in the code, for whoever picks it up
     4. The nearest working equivalent today, as a link

   An unexplained placeholder link is worse than a dead one: it implies a
   capability the product does not have.
   ========================================================================= */

interface NotImplementedSpec {
  /** Top-bar section name. */
  title: string;
  /** Page heading. */
  heading: string;
  /** What the screen does once it exists. */
  purpose: string;
  /** Implementation phase, e.g. "Phase 7". */
  phase: string;
  /** The backend route that must exist first. */
  requires: string;
  /** Where the frontend work lives. */
  implementation: string;
  /** Nearby functionality that works today. */
  nearest: { label: string; to: string; note: string }[];
}

export function NotImplementedScreen(spec: NotImplementedSpec) {
  usePageMeta({
    title: spec.title,
    crumbs: [{ label: "Cases", to: "/cases" }],
  });

  return (
    <PageBody width="reading">
      <PageHeader
        eyebrow={spec.title}
        title={spec.heading}
        description={spec.purpose}
        actions={<Badge tone="ochre" size="md">Not available</Badge>}
      />

      <div className="rounded-xs border border-dashed border-stone bg-surface">
        <div className="flex items-start gap-3 border-b border-stone px-5 py-4">
          <CircleSlash className="mt-0.5 size-4 shrink-0 text-slate" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-caption font-medium text-ink">
              This screen has not been built.
            </p>
            <p className="mt-1 text-note leading-relaxed text-slate">
              No backend endpoint serves this data, so anything shown here would be
              invented. It stays empty until {spec.phase} lands.
            </p>
          </div>
        </div>

        <dl className="space-y-4 px-5 py-4">
          <SpecRow label="Phase">{spec.phase}</SpecRow>
          <SpecRow label="Requires">
            <code className="ak-mono text-ink">{spec.requires}</code>
          </SpecRow>
          <SpecRow label="Frontend">
            <code className="ak-mono text-ink">{spec.implementation}</code>
          </SpecRow>
        </dl>

        <div className="border-t border-stone bg-paper/60 px-5 py-4">
          <p className="ak-label mb-2.5">Available today</p>
          <ul className="space-y-2">
            {spec.nearest.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="group flex items-start gap-2 text-note text-ink transition-colors hover:text-forest"
                >
                  <ArrowRight
                    className="mt-1 size-3.5 shrink-0 text-slate transition-colors group-hover:text-forest"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-medium">{item.label}</span>
                    <span className="block text-note text-slate">{item.note}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageBody>
  );
}

function SpecRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-4">
      <dt className="ak-label sm:pt-0.5">{label}</dt>
      <dd className="min-w-0 break-words text-note text-slate">{children}</dd>
    </div>
  );
}

/* ── Destinations ───────────────────────────────────────────────────────── */

export function EvidenceLibraryPage() {
  return (
    <NotImplementedScreen
      title="Evidence Library"
      heading="Evidence Library"
      purpose="Indexed literature with its provenance: which source document, which requirement, and the excerpt that was actually retrieved."
      phase="Phase 7"
      requires="POST /api/v1/retrieval/evidence"
      implementation="ui/src/components/pipeline/steps/step-evidence-search.tsx"
      nearest={[
        {
          label: "Case analysis",
          to: "/cases/aeg-2024-0147",
          note: "Shows the retrieved records attached to a case, once retrieval exists.",
        },
        {
          label: "Evidence stage",
          to: "/cases/aeg-2024-0147/pipeline",
          note: "The pipeline placeholder reserved for this stage.",
        },
      ]}
    />
  );
}

export function PayerPoliciesPage() {
  return (
    <NotImplementedScreen
      title="Payer Policies"
      heading="Payer Policies"
      purpose="Coverage criteria held in the knowledge graph, mapping each CARC code to the requirements a case must satisfy."
      phase="Phase 6"
      requires="POST /api/v1/retrieval/graph"
      implementation="ui/src/components/pipeline/steps/step-graph-reasoning.tsx"
      nearest={[
        {
          label: "Requirement checklist",
          to: "/cases/aeg-2024-0147",
          note: "Requirements are shown per case with the policy passage each one cites.",
        },
      ]}
    />
  );
}

export function KnowledgeGraphPage() {
  return (
    <NotImplementedScreen
      title="Knowledge Graph"
      heading="Knowledge Graph"
      purpose="Patient, diagnosis, procedure, policy, requirement and statute nodes connected by labelled relationships, with filtering and focus controls."
      phase="Phase 6"
      requires="Neo4j traversal via src/aegis/graph/retrieval.py"
      implementation="ui/src/pages/knowledge-graph-page.tsx"
      nearest={[
        {
          label: "Evidence trail",
          to: "/cases/aeg-2024-0147",
          note: "Shows the same relationships as a linear, readable chain.",
        },
      ]}
    />
  );
}

export function AppealsPage() {
  return (
    <NotImplementedScreen
      title="Appeals"
      heading="Appeals"
      purpose="Drafting workspace for evidence-backed appeal letters, with citations linked to their sources and missing-evidence warnings."
      phase="Phase 10"
      requires="POST /api/v1/appeals"
      implementation="ui/src/components/pipeline/steps/step-appeal-letter.tsx"
      nearest={[
        {
          label: "Case analysis",
          to: "/cases/aeg-2024-0147",
          note: "Assemble the material an appeal would be built from.",
        },
      ]}
    />
  );
}

/* ── Not found ───────────────────────────────────────────────────────────── */

export function NotFoundPage() {
  usePageMeta({ title: "Not found", crumbs: [{ label: "Overview", to: "/" }] });

  return (
    <PageBody width="reading">
      <PageHeader
        eyebrow="404"
        title="This page does not exist"
        description="The address does not match any screen in the workspace."
      />
      <p className={cn("text-caption text-slate")}>
        <Link
          to="/"
          className="font-medium text-forest underline underline-offset-4 hover:text-forest-deep"
        >
          Return to the overview
        </Link>{" "}
        <ExternalLink className="size-3 inline" aria-hidden="true" />
      </p>
    </PageBody>
  );
}