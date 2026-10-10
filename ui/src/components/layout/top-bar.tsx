import { ChevronRight, RotateCcw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { DataSourceSwitch } from "@/components/common/data-source";
import { useCurrentPageMeta } from "@/components/layout/page-context";
import { usePipeline } from "@/state/pipeline";

/* ============================================================================
   Top bar
   ----------------------------------------------------------------------------
   Carries navigation context, not branding. The product name already appears in
   the rail; repeating it here spent the most valuable strip of screen on
   something the user does not need to re-read on every page.

   Layout, in priority order:
     left   breadcrumb trail, then the current page title
     right  data source switch, active document, Start over

   "Start over" resets in-memory pipeline state only. Nothing is sent to the
   backend and nothing is deleted server-side.
   ========================================================================= */

export function TopBar() {
  const { title, crumbs } = useCurrentPageMeta();
  const { reset, upload } = usePipeline();
  const navigate = useNavigate();

  function handleReset() {
    reset();
    navigate("/cases/new");
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-14 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-stone bg-surface/95 px-5 py-2.5 backdrop-blur-[2px] sm:px-8">
      {/* Where am I */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* Breadcrumbs need horizontal room to be useful. Below `xl` they
            truncate to noise, so the section title carries the context alone. */}
        {crumbs.length > 0 ? (
          <nav
            aria-label="Breadcrumb"
            className="hidden min-w-0 shrink overflow-hidden xl:block"
          >
            <ol className="flex min-w-0 flex-nowrap items-center gap-1.5">
              {crumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
                  {index > 0 ? (
                    <ChevronRight
                      className="size-3 shrink-0 text-stone"
                      aria-hidden="true"
                    />
                  ) : null}
                  {crumb.to ? (
                    <Link
                      to={crumb.to}
                      className="truncate text-note text-slate transition-colors hover:text-ink hover:underline underline-offset-4"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="truncate text-note text-slate">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        {crumbs.length > 0 ? (
          <ChevronRight
            className="hidden size-3.5 shrink-0 text-stone xl:block"
            aria-hidden="true"
          />
        ) : null}

        <h1 className="min-w-0 truncate font-serif text-[1.125rem] leading-tight text-ink">
          {title}
        </h1>
      </div>

      {/* What can I act on */}
      <div className="flex shrink-0 items-center gap-2.5">
        <DataSourceSwitch />

        {upload ? (
          <span
            className="ak-mono hidden max-w-[10rem] truncate text-slate xl:block"
            title={`Active document ${upload.document_id}`}
          >
            {upload.filename}
          </span>
        ) : null}

        <Button variant="secondary" size="sm" onClick={handleReset} className="whitespace-nowrap">
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Start over
        </Button>
      </div>
    </header>
  );
}