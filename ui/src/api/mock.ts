/* ============================================================================
   Mock API client — fictional demonstration data.
   ----------------------------------------------------------------------------
   IMPORTANT: every value in this file is SYNTHETIC. Payer names, member IDs,
   claim IDs and letters are fabricated for demonstration. No real PHI, no real
   payer data, and nothing here should ever be presented as a real analysis.

   The shape of every response is identical to `live.ts`, so swapping data
   sources changes nothing in the UI. The top bar always displays which source
   is active; mock data is never mixed with live data silently.
   ========================================================================= */

import type { AegisApiClient } from "./live";
import type { ExtractionResponse, UploadResponse } from "@/types/api";

/** Simulated latency so loading and processing states are actually visible. */
const LATENCY = { min: 550, max: 1100 } as const;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function simulate(): Promise<void> {
  const { min, max } = LATENCY;
  return delay(min + Math.random() * (max - min));
}

/** A stable per-session mock document id, so the extraction step can be reused. */
function mockDocumentId(): string {
  return "mock-3f7c1a20-9b41-4c8e-a0d6-2e51b8c47f19";
}

const SAMPLE_DENIAL_TEXT = `ACMECARE HEALTH INSURANCE
Plan Administration Division
P.O. Box 4499, Hartford, CT 06102

CLAIM ADJUSTMENT NOTICE
Date of Notice: 14 March 2024

Member: Maria Gonzalez
Member ID: ACM-8827451-01
Group Number: GRP-20240-TX
Provider: Priya Sharma, MD - Capital Endocrine Associates
Provider NPI: 1234567890
Claim ID: CLM-2024-088417
Date of Service: 02 February 2024

PROCEDURE DENIED
  CPT 95251 - Continuous glucose monitoring, 72 hours minimum
DIAGNOSIS
  E11.9 - Type 2 diabetes mellitus without complications

DENIAL REASON
  CARC CO-167: Diagnosis(es) is (are) not covered by this payer/contractor.
  The requested service is not covered under policy ACME-CGM-2024-001 because
  required step therapy has not been documented as completed.

To appeal this decision, submit a written appeal within 180 days of the date
of this notice, together with supporting clinical documentation.

This notice is a synthetic demonstration document.`;

export async function uploadDocument(file: File): Promise<UploadResponse> {
  await simulate();
  return {
    document_id: mockDocumentId(),
    filename: file.name,
    content_type: file.type || "application/pdf",
    // Plausible for a letter of this length; synthetic.
    page_count: 2,
    extracted_text_preview: SAMPLE_DENIAL_TEXT.slice(0, 500),
  };
}

export async function runExtraction(): Promise<ExtractionResponse> {
  await simulate();
  const span = (
    text: string,
    normalized: string,
    category: string,
    start: number,
  ) => ({
    text,
    normalized,
    category,
    source: "regex",
    start_char: start,
    end_char: start + text.length,
  });

  return {
    document_id: mockDocumentId(),
    filename: "scenario_1_denial.pdf",
    raw_entity_count: 10,
    entities: {
      icd10_codes: [span("E11.9", "E11.9", "icd10", 412)],
      cpt_codes: [span("95251", "95251", "cpt", 355)],
      denial_codes: [span("CO-167", "CO-167", "carc", 468)],
      payer_name: "AcmeCare Health Insurance",
      provider_npi: "1234567890",
      member_id: "ACM-8827451-01",
      claim_id: "CLM-2024-088417",
      policy_id: "ACME-CGM-2024-001",
    },
  };
}

/** The mock backend is always considered reachable — nothing is really called. */
export async function ping(): Promise<boolean> {
  await delay(120);
  return true;
}

export const mockClient: AegisApiClient = {
  mode: "mock",
  uploadDocument,
  runExtraction,
  ping,
};