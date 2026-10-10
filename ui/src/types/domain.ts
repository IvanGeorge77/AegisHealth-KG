/* ============================================================================
   Domain types — UI-level vocabulary.
   ----------------------------------------------------------------------------
   These describe the *workspace* concepts (cases, requirements, evidence,
   appeals). Most are not yet exposed by the backend: the Phase 6/7/10/11 routes
   do not exist yet. They are declared here so the UI structure is stable, and
   every consumer must treat them as unavailable until a real endpoint lands.

   Phase → future endpoint mapping is recorded on each type.
   ========================================================================= */

/** Where a field's value came from. Never blur these lines in the UI. */
export type Provenance =
  /** Read verbatim from the denial letter / source document. */
  | "document"
  /** Produced by the extraction pipeline (Phase 5). */
  | "extraction"
  /** Retrieved from the knowledge graph (Phase 6). */
  | "graph"
  /** Retrieved from the vector index (Phase 7). */
  | "evidence"
  /** Drafted by the language model (Phase 10) — never treat as fact. */
  | "generated"
  /** Human reviewer decision. */
  | "human";

/**
 * Requirement review status.
 *
 * Critical rule from docs/SCOPE.md: the *presence* of a document is not proof
 * that a requirement is satisfied. Only `verified` may be presented as met, and
 * it requires a citation.
 */
export type RequirementStatus =
  | "verified" // Verified in record
  | "missing" // Missing evidence
  | "review" // Requires human review
  | "conflicting" // Conflicting evidence
  | "not_applicable"; // Not applicable — with a justification

/** A single payer requirement from the knowledge graph (Phase 6). */
export interface Requirement {
  id: string;
  description: string;
  /** Prerequisite / Prior auth / Clinical documentation / Medical necessity. */
  type: string;
  /** What documentation would satisfy this requirement. */
  evidenceRequired: string;
  /** Order within a step-therapy sequence; 0 when not sequential. */
  order: number;
  status: RequirementStatus;
  /** Source citation, e.g. policy §Coverage Criteria. */
  citation?: string;
  /** Reference to the evidence item that supports this status. */
  evidenceRef?: string;
  /** Required when status is `not_applicable` or `conflicting`. */
  justification?: string;
}

/** A document that exists in the case record. */
export interface CaseDocument {
  id: string;
  filename: string;
  documentType: "denial_letter" | "eob" | "clinical_note" | "supporting";
  uploadedAt: string;
  pageCount?: number;
}

/**
 * Something the case needs but the record does not contain.
 *
 * Tracked explicitly rather than inferred, so the workspace can warn about a
 * gap without implying that a missing file is a verified absence — we only
 * know it was requested.
 */
export interface MissingDocument {
  label: string;
  /** Why it matters — which requirement it would satisfy. */
  reason: string;
  /** Requirement this gap blocks, when known. */
  blocksRequirementId?: string;
  requestedOn: string;
}

/** The insurer's stated position, verbatim. */
export interface DenialSummary {
  /** CARC code as printed on the letter, e.g. CO-167. */
  carcCode: string;
  /** Payer's own words. Facts, not interpretation. */
  statedReason: string;
  policyId?: string;
  payerName?: string;
  claimId?: string;
  serviceDate?: string;
  /** Where in the record this came from. */
  citation?: string;
}

/** A retrieved citation. Vector-retrieval output (Phase 7). */
export interface EvidenceItem {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  /** Retrieval score + the query that produced it, so relevance is auditable. */
  relevance?: number;
  /** Which requirement this was retrieved to support. */
  supportsRequirementId?: string;
  /** Short excerpt actually present in the source. Never paraphrased. */
  excerpt?: string;
  publicationType?: string;
}

/** A case in the workspace. */
export interface CaseRecord {
  id: string;
  /** Human-readable case reference, e.g. AEG-2024-0147. */
  reference: string;
  title: string;
  service: string;
  payerName: string;
  denialCategory: string;
  carcCode: string;
  /** The single next action a reviewer must take. */
  nextAction: string;
  status: "awaiting_documents" | "in_review" | "ready_for_review" | "drafted";
  updatedAt: string;
  memberId: string;
  documents: CaseDocument[];
  /** Documents requested from the practice that are not yet on file. */
  missingDocuments: MissingDocument[];
  /** Who owns the next action. */
  assignee: string;
  /** ICD-10 diagnoses on the claim, as written on the denial letter. */
  diagnoses: string[];
  /** Date of service, as written on the denial letter. */
  serviceDate: string;
  synthetic: true;
}

/**
 * The per-case material the analysis workspace is built from.
 *
 * Split from CaseRecord because the queue only needs the summary fields, while
 * the analysis screen needs the full set. Phase 6 replaces this wholesale with
 * graph output.
 */
export interface CaseDetails {
  caseId: string;
  denialSummary: DenialSummary;
  /** Policy the denial cites, and the requirements it imposes. */
  policy: { policyId: string; payer: string; subject: string };
  requirements: Requirement[];
  evidence: EvidenceItem[];
  /** Chain from denial → requirement → evidence, shown in the evidence trail. */
  trail: EvidenceLink[];
}

/**
 * One hop in the evidence trail: the reasoning step that connects a payer's
 * denial to the requirement it invokes and the record that answers it.
 */
export interface EvidenceLink {
  id: string;
  /** Short statement of the reasoning step, in plain language. */
  assertion: string;
  /** Where this comes from — the requirement's citation. */
  citation: string;
  requirementId?: string;
  /** Evidence record supporting this step. */
  evidenceId?: string;
  /** Case document that contains the supporting passage. */
  documentId?: string;
  /** Verbatim excerpt from the source document, never paraphrased. */
  excerpt?: string;
  /** How strong this link is. */
  strength: "supported" | "missing" | "contested";
}