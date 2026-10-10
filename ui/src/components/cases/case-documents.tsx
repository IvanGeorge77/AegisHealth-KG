import { FileText, FileWarning, Upload } from "lucide-react";
import { Link } from "react-router-dom";

import { PanelHeading } from "@/components/cases/denial-summary";
import { Button } from "@/components/ui/button";
import { formatDate, pluralise } from "@/lib/format";
import type { CaseDocument, MissingDocument } from "@/types/domain";

/* ============================================================================
   Case documents
   ----------------------------------------------------------------------------
   Two halves: what is on file, and what has been asked for and has not
   arrived. The second is the part that blocks a case, so it is given equal
   weight rather than being folded into a count.

   A missing document means "requested and not received". It is not proof that
   the underlying evidence does not exist — only that this case does not hold it.
   ========================================================================= */

export function CaseDocuments({
  documents,
  missing,
}: {
  documents: CaseDocument[];
  missing: MissingDocument[];
}) {
  return (
    <section aria-labelledby="case-documents">
      <PanelHeading
        id="case-documents"
        title="Case record"
        provenance="Documents on file"
      />

      {documents.length === 0 ? (
        <p className="rounded-xs border border-dashed border-stone bg-surface/60 px-5 py-5 text-center text-caption text-slate">
          No documents have been supplied for this case.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex items-baseline gap-3 rounded-xs border border-stone bg-surface px-4 py-2.5"
            >
              <FileText className="size-4 shrink-0 self-center text-slate" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="ak-mono block truncate text-ink">{document.filename}</span>
                <span className="text-note text-slate">
                  {documentTypeLabel(document.documentType)}
                  {document.pageCount ? ` · ${document.pageCount} pages` : ""} ·{" "}
                  {formatDate(document.uploadedAt)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {missing.length > 0 ? (
        <div className="mt-5">
          <p className="mb-2.5 flex items-center gap-2 text-caption font-semibold text-denial">
            <FileWarning className="size-4 shrink-0" aria-hidden="true" />
            {missing.length} {pluralise(missing.length, "document")} requested but not on file
          </p>

          <ul className="space-y-2">
            {missing.map((item) => (
              <li
                key={item.label}
                className="rounded-xs border border-denial/30 border-l-2 bg-denial-soft/50 px-4 py-3"
              >
                <p className="text-caption font-medium text-ink">{item.label}</p>
                <p className="mt-1 text-note leading-relaxed text-slate">{item.reason}</p>
                <p className="ak-mono mt-1.5 text-note text-slate">
                  Requested {formatDate(item.requestedOn)}
                  {item.blocksRequirementId
                    ? ` · blocks ${item.blocksRequirementId}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-2.5 text-note leading-relaxed text-slate">
            A request is not a finding. Until the document arrives, nothing can be concluded
            about whether the underlying evidence exists.
          </p>
        </div>
      ) : null}

      <div className="mt-4">
        <Link to="/cases/new">
          <Button variant="secondary" size="sm">
            <Upload className="size-4" aria-hidden="true" />
            Upload a document
          </Button>
        </Link>
      </div>
    </section>
  );
}

function documentTypeLabel(type: CaseDocument["documentType"]): string {
  switch (type) {
    case "denial_letter":
      return "Denial letter";
    case "eob":
      return "Explanation of benefits";
    case "clinical_note":
      return "Clinical note";
    case "supporting":
      return "Supporting document";
  }
}