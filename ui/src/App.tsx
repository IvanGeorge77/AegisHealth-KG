import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { PageMetaProvider } from "@/components/layout/page-context";
import { OverviewPage } from "@/pages/overview-page";
import { CasesPage } from "@/pages/cases-page";
import { CaseAnalysisPage } from "@/pages/case-analysis-page";
import { CaseWorkspacePage } from "@/pages/case-workspace-page";
import {
  AppealsPage,
  EvidenceLibraryPage,
  KnowledgeGraphPage,
  NotFoundPage,
  PayerPoliciesPage,
} from "@/pages/pending-pages";
import { PipelineProvider } from "@/state/pipeline";
import { DataSourceProvider } from "@/state/data-source";

/**
 * The landing page carries the WebGL runtime, which is the bulk of the bundle.
 * Loading it on demand keeps three.js out of the workspace's critical path —
 * someone opening a case pays nothing for the marketing surface.
 */
const LandingPage = lazy(() =>
  import("@/landing/landing-page").then((m) => ({ default: m.LandingPage })),
);

/** Neutral backdrop so the landing fade-in does not flash white. */
function LandingFallback() {
  return <div className="min-h-screen bg-[#05070a]" aria-busy="true" />;
}

/* ============================================================================
   AegisHealth-KG — application root
   ----------------------------------------------------------------------------
   Two distinct surfaces, deliberately kept apart:

     /            the landing page. Cinematic, dark, full-bleed, no chrome.
                  Renders OUTSIDE the app shell so the product's navigation
                  rail and paper background never appear behind it.

     everything else
                  the investigation workspace — warm, document-oriented, with
                  the persistent rail and top bar.

   "Explore AegisHealth-KG" and "Get Started" both route to /explore, which is
   the workspace overview. No fake destinations, no dead CTAs.

   Provider order matters: the data source selects the API client, and the
   pipeline store consumes that client. Data flows one way:

       view → store → api client → (mock | live backend)

   Routes
   ------
   /                        Landing page
   /explore                 Workspace overview — cases requiring attention
   /cases                   Case register
   /cases/:caseId           Case analysis — the review workspace
   /cases/:caseId/pipeline  Processing pipeline — upload and extraction
   /cases/new/pipeline      New case, straight to the pipeline
   /evidence                Evidence Library   (explains what is missing)
   /policies                Payer Policies     (explains what is missing)
   /graph                   Knowledge Graph    (explains what is missing)
   /appeals                 Appeals            (explains what is missing)
   ========================================================================= */

export function App() {
  return (
    <DataSourceProvider>
      <PipelineProvider>
        <PageMetaProvider>
          <Routes>
            {/* Landing — full bleed, no application chrome. */}
            <Route
              path="/"
              element={
                <div className="landing-surface font-display">
                  <Suspense fallback={<LandingFallback />}>
                    <LandingPage />
                  </Suspense>
                </div>
              }
            />

            {/* The workspace, behind /explore. */}
            <Route
              element={
                <AppShell>
                  <Outlet />
                </AppShell>
              }
            >
              <Route path="/explore" element={<OverviewPage />} />
              <Route path="/cases" element={<CasesPage />} />
              <Route path="/cases/:caseId" element={<CaseAnalysisPage />} />
              <Route path="/cases/:caseId/pipeline" element={<CaseWorkspacePage />} />
              <Route
                path="/cases/new"
                element={<Navigate to="/cases/new/pipeline" replace />}
              />
              <Route path="/cases/new/pipeline" element={<CaseWorkspacePage />} />
              <Route path="/evidence" element={<EvidenceLibraryPage />} />
              <Route path="/policies" element={<PayerPoliciesPage />} />
              <Route path="/graph" element={<KnowledgeGraphPage />} />
              <Route path="/appeals" element={<AppealsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </PageMetaProvider>
      </PipelineProvider>
    </DataSourceProvider>
  );
}