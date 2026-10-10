import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FilePlus2, SlidersHorizontal } from "lucide-react";

import { PageBody, PageHeader, SectionLabel } from "@/components/layout/page";
import { usePageMeta } from "@/components/layout/page-context";
import { Button } from "@/components/ui/button";
import { CaseRow } from "@/components/cases/case-row";
import { CASE_STATUS_LABELS } from "@/components/common/status";
import { Notice } from "@/components/common/placeholders";
import { DEMO_CASES } from "@/data/demo";
import { cn } from "@/lib/cn";
import type { CaseRecord } from "@/types/domain";

/* ============================================================================
   Case register
   ----------------------------------------------------------------------------
   A filterable index of every case in the workspace, using the same row
   component as the overview so a case reads identically in both places.
   Selecting a row opens the case-analysis workspace.
   ========================================================================= */

type StatusFilter = "all" | CaseRecord["status"];

const FILTERS: StatusFilter[] = [
  "all",
  "awaiting_documents",
  "in_review",
  "ready_for_review",
  "drafted",
];

export function CasesPage() {
  usePageMeta({ title: "Cases", crumbs: [] });

  const [status, setStatus] = useState<StatusFilter>("all");
  const [payer, setPayer] = useState<string>("all");

  const payers = useMemo(
    () => Array.from(new Set(DEMO_CASES.map((record) => record.payerName))).sort(),
    [],
  );

  const rows = useMemo(
    () =>
      DEMO_CASES.filter(
        (record) =>
          (status === "all" || record.status === status) &&
          (payer === "all" || record.payerName === payer),
      ),
    [status, payer],
  );

  const filtered = status !== "all" || payer !== "all";

  function resetFilters() {
    setStatus("all");
    setPayer("all");
  }

  return (
    <PageBody>
      <PageHeader
        eyebrow="Register"
        title="All cases"
        description="The full index of denials under investigation. Filter by processing status or payer to narrow the list."
        actions={
          <Link to="/cases/new">
            <Button>
              <FilePlus2 className="size-4" aria-hidden="true" />
              New case
            </Button>
          </Link>
        }
      />

      {/* Filters — working controls, laid out as a single readable line. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-8">
        <FilterGroup label="Status">
          {FILTERS.map((option) => (
            <FilterChip
              key={option}
              active={status === option}
              onClick={() => setStatus(option)}
            >
              {option === "all" ? "All" : CASE_STATUS_LABELS[option]}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Payer">
          <FilterChip active={payer === "all"} onClick={() => setPayer("all")}>
            All
          </FilterChip>
          {payers.map((option) => (
            <FilterChip
              key={option}
              active={payer === option}
              onClick={() => setPayer(option)}
            >
              {option}
            </FilterChip>
          ))}
        </FilterGroup>

        <div className="ml-auto flex items-center gap-3">
          <span className="ak-mono text-note text-slate">
            {rows.length} / {DEMO_CASES.length}
          </span>
          {filtered ? (
            <button
              type="button"
              onClick={resetFilters}
              className="text-note text-forest underline underline-offset-4 hover:text-forest-deep"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {rows.length === 0 ? (
        <Notice tone="neutral" title="No matching cases">
          No case in the register matches the current filters.
        </Notice>
      ) : (
        <>
          <SectionLabel className="sr-only">Results</SectionLabel>
          <ul className="space-y-2">
            {rows.map((record) => (
              <li key={record.id}>
                <CaseRow record={record} variant="register" />
              </li>
            ))}
          </ul>
        </>
      )}
    </PageBody>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="ak-label flex items-center gap-1.5">
        <SlidersHorizontal className="size-3" aria-hidden="true" />
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "whitespace-nowrap rounded-xs border px-2.5 py-1 text-note transition-colors",
        active
          ? "border-forest bg-forest text-white"
          : "border-stone bg-surface text-slate hover:border-slate hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}