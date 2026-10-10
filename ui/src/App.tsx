import { Navigate, Route, Routes } from "react-router-dom";

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

/* ============================================================================
   AegisHealth-KG — application root
   ----------------------------------------------------------------------------
   Provider order matters: the data source selects the API client, and the
   pipeline store consumes that client. Data flows one way:

       view → store → api client → (mock | live backend)

   Routes
   ------
   /                        Overview — cases requiring attention
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
          <AppShell>
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/cases" element={<CasesPage />} />
              <Route path="/cases/:caseId" element={<CaseAnalysisPage />} />
              <Route path="/cases/:caseId/pipeline" element={<CaseWorkspacePage />} />
              <Route path="/cases/new" element={<Navigate to="/cases/new/pipeline" replace />} />
              <Route path="/cases/new/pipeline" element={<CaseWorkspacePage />} />
              <Route path="/evidence" element={<EvidenceLibraryPage />} />
              <Route path="/policies" element={<PayerPoliciesPage />} />
              <Route path="/graph" element={<KnowledgeGraphPage />} />
              <Route path="/appeals" element={<AppealsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AppShell>
        </PageMetaProvider>
      </PipelineProvider>
    </DataSourceProvider>
  );
}