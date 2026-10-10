import { Link } from "react-router-dom";
import { ArrowRight, FilePlus2 } from "lucide-react";

import { PageBody, PageHeader, SectionLabel } from "@/components/layout/page";
import { usePageMeta } from "@/components/layout/page-context";
import { Button } from "@/components/ui/button";
import { CaseRow } from "@/components/cases/case-row";
import { Notice } from "@/components/common/placeholders";
import { DEMO_CASES, countMissingDocuments, summariseCases } from "@/data/demo";
import { formatRelative } from "@/lib/format";
import type { CaseRecord } from "@/types/domain";

/* ============================================================================
   Overview
   ----------------------------------------------------------------------------
   An actionable queue, not an analytics dashboard. The organising question is
   "what needs a human next?", so the page is built around a prioritised list of
   cases. Counts are inline figures in a single line — there are no charts here
   because none of them would change a decision.
   ========================================================================= */

export function OverviewPage() {
  usePageMeta({ title: "Overview", crumbs: [] });

  // The case register has no backend endpoint in either mode. The data-source
  // banner states which transport is active for the stages that do have one.
  const cases = DEMO_CASES;
  const counts = summariseCases(cases);
  const missing = countMissingDocuments(cases);

  // Priority: anything blocked on a document or a decision comes first, then
  // cases furthest along the pipeline. Within a tier, most recently touched.
  const priorityRank: Record<CaseRecord["status"], number> = {
    awaiting_documents: 0,
    in_review: 1,
    ready_for_review: 2,
    drafted: 3,
  };
  const queue = [...cases].sort(
    (a, b) =>
      priorityRank[a.status] - priorityRank[b.status] ||
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <PageBody>
      <PageHeader
        eyebrow="Overview"
        title="Cases requiring attention"
        description="Every open denial in the workspace, ordered by what blocks progress. Selecting a case opens its analysis workspace."
        actions={
          <Link to="/cases/new">
            <Button>
              <FilePlus2 className="size-4" aria-hidden="true" />
              New case
            </Button>
          </Link>
        }
      />

      {/* Compact counts — one line, whitespace-separated, no rule, no cards. */}
      <dl className="flex flex-wrap items-baseline gap-x-9 gap-y-2 pb-8">
        {[
          ["Open cases", counts.total],
          ["Awaiting documents", counts.awaitingDocuments],
          ["In review", counts.inReview],
          ["Ready for review", counts.readyForReview],
          ["Documents outstanding", missing],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex items-baseline gap-2">
            <dt className="ak-label">{label}</dt>
            <dd className="font-serif text-[1.375rem] leading-none text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_19rem]">
        {/* ── Prioritised queue ─────────────────────────────────────── */}
        <section className="min-w-0">
          <SectionLabel trailing={`${queue.length} cases`}>Prioritised queue</SectionLabel>

          <ul className="space-y-2">
            {queue.map((record) => (
              <li key={record.id}>
                <CaseRow record={record} />
              </li>
            ))}
          </ul>
        </section>

        {/* ── Sidebar ────────────────────────────────────────────────── */}
        <aside className="space-y-10">
          <section>
            <SectionLabel>Recently touched</SectionLabel>
            <ol className="space-y-3">
              {cases
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
                )
                .slice(0, 4)
                .map((record) => (
                  <li key={record.id}>
                    <Link
                      to={`/cases/${record.id}`}
                      className="group block"
                    >
                      <p className="text-note text-ink transition-colors group-hover:text-forest">
                        {activityLine(record)}
                      </p>
                      <p className="ak-mono text-note text-slate">
                        {record.reference} · {formatRelative(record.updatedAt)}
                      </p>
                    </Link>
                  </li>
                ))}
            </ol>
          </section>

          <section>
            <SectionLabel>Workspace state</SectionLabel>
            <dl className="space-y-2.5 rounded-xs border border-stone bg-surface px-4 py-4">
              {[
                ["Documents ingested", String(cases.reduce((n, c) => n + c.documents.length, 0))],
                ["Requirements evaluated", "0"],
                ["Graph traversals", "0"],
                ["Evidence records retrieved", "0"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-note text-slate">{label}</dt>
                  <dd className="ak-mono text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-note leading-relaxed text-slate">
              The zeroes are accurate. Those stages have no backend endpoint yet, so no
              requirement has been evaluated and no evidence retrieved. Per-stage status is
              visible inside each case.
            </p>
          </section>

          <Notice tone="neutral" title="Start here">
            <p>
              The pipeline is where documents are ingested and entities extracted. The
              analysis workspace is where a case is reviewed.
            </p>
            <Link
              to="/cases/new"
              className="mt-2 inline-flex items-center gap-1.5 text-caption font-medium text-forest underline underline-offset-4"
            >
              Open the pipeline
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Notice>
        </aside>
      </div>
    </PageBody>
  );
}

function activityLine(record: CaseRecord): string {
  switch (record.status) {
    case "awaiting_documents":
      return `Waiting on ${record.nextAction.toLowerCase()}`;
    case "in_review":
      return `Reviewer action — ${record.nextAction.toLowerCase()}`;
    case "ready_for_review":
      return "Assembled and awaiting sign-off";
    case "drafted":
      return "Appeal draft prepared, not yet verified";
  }
}