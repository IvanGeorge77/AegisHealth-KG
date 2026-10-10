import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, FileWarning } from "lucide-react";

import { CaseStatusBadge, CarcBadge } from "@/components/common/status";
import { cn } from "@/lib/cn";
import { formatDate, formatRelative, pluralise } from "@/lib/format";
import type { CaseRecord } from "@/types/domain";

/* ============================================================================
   Case row
   ----------------------------------------------------------------------------
   The queue's repeating unit, shared by the Overview and the case register so a
   case looks and reads identically wherever it appears.

   Hierarchy, strongest first:
     1. Procedure / service   — what the case is about. Serif, largest.
     2. Next action           — what a human must do. Prominent, in ink.
     3. Status                — badge, upper left, colour + icon + word.
     4. Denial reason         — CARC code + category, mono where technical.
     5. Case reference        — mono, quiet. An identifier, not a headline.
     6. Payer · assignee · documents · date — metadata, quietest.

   Rows are grouped by whitespace and a hairline container edge rather than by
   a rule between every entry. The whole row is one link target.
   ========================================================================= */

export function CaseRow({
  record,
  variant = "queue",
}: {
  record: CaseRecord;
  /** `queue` shows the next action; `register` is denser, for the full list. */
  variant?: "queue" | "register";
}) {
  const missing = record.missingDocuments.length;

  return (
    <Link
      to={`/cases/${record.id}`}
      className={cn(
        "ak-row group block px-4 py-4 sm:px-5",
        variant === "register" && "py-3.5",
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-6">
        {/* ── Identity and status ─────────────────────────────────────── */}
        <div className="flex min-w-0 items-center gap-2.5 lg:w-[13.5rem] lg:shrink-0 lg:flex-col lg:items-start lg:gap-1.5">
          <CaseStatusBadge status={record.status} />
          <span className="ak-mono truncate text-slate lg:mt-0.5">{record.reference}</span>
        </div>

        {/* ── What the case is about, and what to do about it ─────────── */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h4 className="min-w-0 font-serif text-[1.125rem] leading-snug text-ink">
              {record.service}
            </h4>
            <ArrowUpRight
              className="mt-1 size-4 shrink-0 text-stone transition-colors group-hover:text-forest"
              aria-hidden="true"
            />
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-note text-slate">
            <CarcBadge code={record.carcCode} />
            <span aria-hidden="true" className="text-stone">
              ·
            </span>
            <span>{record.denialCategory}</span>
          </p>

          <p className="mt-2.5 flex items-start gap-2 text-caption text-ink">
            <span className="ak-label mt-[3px] shrink-0">Next</span>
            <span className="min-w-0">{record.nextAction}</span>
          </p>

          {missing > 0 ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-note text-denial">
              <FileWarning className="size-3.5 shrink-0" aria-hidden="true" />
              {missing} {pluralise(missing, "document")} requested but not on file
            </p>
          ) : null}
        </div>

        {/* ── Metadata column ─────────────────────────────────────────── */}
        <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-1.5 border-t border-stone/70 pt-3 text-note lg:w-[13.5rem] lg:grid-cols-1 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <MetaRow label="Payer" value={record.payerName} />
          <MetaRow label="Assignee" value={record.assignee} />
          <MetaRow
            label="Documents"
            value={`${record.documents.length} on file`}
            className={record.documents.length === 0 ? "text-denial" : undefined}
          />
          <MetaRow
            label="Updated"
            value={formatRelative(record.updatedAt)}
            title={formatDate(record.updatedAt)}
          />
        </dl>
      </div>
    </Link>
  );
}

function MetaRow({
  label,
  value,
  className,
  title,
}: {
  label: string;
  value: string;
  className?: string;
  title?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 lg:justify-normal lg:gap-3">
      <dt className="ak-label shrink-0">{label}</dt>
      <dd
        className={cn("min-w-0 truncate text-right text-slate lg:text-left", className)}
        title={title ?? value}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Prominent warning used when a case cannot progress at all — no documents on
 * file means there is nothing to analyse.
 */
export function CaseBlockedNotice({ record }: { record: CaseRecord }) {
  if (record.documents.length > 0) return null;

  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-note text-denial">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      No documents on file — the case cannot be opened until the denial letter is received.
    </p>
  );
}