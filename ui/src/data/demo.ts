import { daysAgo } from "@/lib/format";
import type {
  CaseDetails,
  CaseRecord,
  EvidenceItem,
  Requirement,
} from "@/types/domain";

/* ============================================================================
   Demonstration data — SYNTHETIC.
   ----------------------------------------------------------------------------
   Every payer, member, claim, policy and letter below is fabricated for
   demonstration purposes, consistent with the synthetic-data policy in
   docs/SCOPE.md. Names, identifiers and policy numbers do not correspond to
   real entities and must never be presented as real findings.

   Timestamps are generated relative to the current date (see `daysAgo`), so
   the workspace reads as live work without the records going stale. Every
   offset is chosen to keep the scenarios internally consistent: documents
   always predate the case's last update, and the queue orders sensibly.

   This file backs the Overview, the case register, and the case-analysis
   workspace for phases that have no endpoint yet. It can be deleted wholesale
   once the corresponding routes exist.
   ========================================================================= */

export const SYNTHETIC_NOTICE =
  "Synthetic demonstration data — no real patient or payer information.";

/** Shown beside any content derived from this file. */
export const DEMO_SOURCE_LABEL = "Demonstration record";

/* ── Cases ────────────────────────────────────────────────────────────────
   Offsets from today:
     0147  in review, updated yesterday
     0152  blocked on a document, updated yesterday
     0158  assembled, awaiting sign-off, updated 2 days ago
     0161  active today
     0166  blocked, no documents on file, updated 3 days ago
     0170  draft prepared, updated 5 days ago
   -------------------------------------------------------------------------- */

export const DEMO_CASES: CaseRecord[] = [
  {
    id: "aeg-2024-0147",
    reference: "AEG-2024-0147",
    title: "Continuous glucose monitoring — step therapy denial",
    service: "CPT 95251 · Continuous glucose monitoring (72h)",
    payerName: "AcmeCare Health Insurance",
    denialCategory: "Step therapy not satisfied",
    carcCode: "CO-167",
    nextAction: "Attach the three-month glucose log and the metformin trial record",
    status: "in_review",
    updatedAt: daysAgo(1, 9, 12),
    memberId: "ACM-8827451-01",
    assignee: "R. Okonjo",
    diagnoses: ["E11.9"],
    serviceDate: "2024-02-02",
    synthetic: true,
    missingDocuments: [
      {
        label: "Blood glucose log, 12 weeks",
        reason:
          "Policy requires a minimum three-month log. The copy on file spans eleven weeks.",
        blocksRequirementId: "REQ-HYPO-LOG",
        requestedOn: daysAgo(4, 10, 0),
      },
    ],
    documents: [
      {
        id: "doc-0147-1",
        filename: "acmecare_cgm_denial.pdf",
        documentType: "denial_letter",
        uploadedAt: daysAgo(6, 11, 4),
        pageCount: 2,
      },
      {
        id: "doc-0147-2",
        filename: "acmecare_eob_088417.pdf",
        documentType: "eob",
        uploadedAt: daysAgo(6, 11, 6),
        pageCount: 4,
      },
      {
        id: "doc-0147-3",
        filename: "metformin_dispensing_record.pdf",
        documentType: "supporting",
        uploadedAt: daysAgo(5, 14, 22),
        pageCount: 3,
      },
    ],
  },
  {
    id: "aeg-2024-0152",
    reference: "AEG-2024-0152",
    title: "Lower extremity MRI — prior authorization",
    service: "CPT 73721 · MRI of lower extremity joint",
    payerName: "AcmeCare Health Insurance",
    denialCategory: "Prior authorization missing",
    carcCode: "CO-197",
    nextAction: "Locate six weeks of physical therapy treatment notes",
    status: "awaiting_documents",
    updatedAt: daysAgo(1, 16, 40),
    memberId: "ACM-8827451-04",
    assignee: "L. Marchetti",
    diagnoses: ["M25.561"],
    serviceDate: "2024-02-19",
    synthetic: true,
    missingDocuments: [
      {
        label: "Physical therapy notes, 6 weeks",
        reason:
          "Policy prerequisite for imaging approval. No treatment notes are on file.",
        blocksRequirementId: "REQ-PHYSIO-6WK",
        requestedOn: daysAgo(3, 9, 30),
      },
      {
        label: "Prior authorization request form",
        reason: "Payer states no authorization was received; the form is not on file.",
        blocksRequirementId: "REQ-PRIOR-AUTH",
        requestedOn: daysAgo(3, 9, 31),
      },
      {
        label: "Clinical examination note",
        reason: "Policy requires a documented examination within 60 days of service.",
        blocksRequirementId: "REQ-CLINICAL-EXAM",
        requestedOn: daysAgo(3, 9, 32),
      },
    ],
    documents: [
      {
        id: "doc-0152-1",
        filename: "acmecare_mri_denial.pdf",
        documentType: "denial_letter",
        uploadedAt: daysAgo(1, 16, 38),
        pageCount: 2,
      },
    ],
  },
  {
    id: "aeg-2024-0158",
    reference: "AEG-2024-0158",
    title: "Outpatient psychotherapy — session limit",
    service: "CPT 90837 · Psychotherapy, 60 minutes",
    payerName: "AcmeCare Health Insurance",
    denialCategory: "Medical necessity not established",
    carcCode: "CO-50",
    nextAction: "Check the twenty-session limit against parity requirements",
    status: "ready_for_review",
    updatedAt: daysAgo(2, 8, 5),
    memberId: "ACM-8827451-07",
    assignee: "S. Bhattacharya",
    diagnoses: ["F33.1"],
    serviceDate: "2024-01-30",
    synthetic: true,
    missingDocuments: [],
    documents: [
      {
        id: "doc-0158-1",
        filename: "acmecare_therapy_denial.pdf",
        documentType: "denial_letter",
        uploadedAt: daysAgo(4, 10, 22),
        pageCount: 3,
      },
      {
        id: "doc-0158-2",
        filename: "progress_note_session_21.pdf",
        documentType: "clinical_note",
        uploadedAt: daysAgo(4, 10, 25),
        pageCount: 6,
      },
    ],
  },
  {
    id: "aeg-2024-0161",
    reference: "AEG-2024-0161",
    title: "Inpatient observation — medical necessity",
    service: "CPT 99221 · Initial hospital care",
    payerName: "Northgate Mutual",
    denialCategory: "Medical necessity not established",
    carcCode: "CO-50",
    nextAction: "Assign a reviewer — the two payers' criteria conflict",
    status: "in_review",
    updatedAt: daysAgo(0, 7, 55),
    memberId: "NGM-4419022",
    assignee: "Unassigned",
    diagnoses: ["E11.65", "J18.9"],
    serviceDate: "2024-02-27",
    synthetic: true,
    missingDocuments: [
      {
        label: "Admission history and physical",
        reason: "Two payers apply different observation criteria; the H&P decides between them.",
        requestedOn: daysAgo(1, 8, 0),
      },
    ],
    documents: [
      {
        id: "doc-0161-1",
        filename: "northgate_observation_denial.pdf",
        documentType: "denial_letter",
        uploadedAt: daysAgo(0, 7, 50),
        pageCount: 5,
      },
    ],
  },
  {
    id: "aeg-2024-0166",
    reference: "AEG-2024-0166",
    title: "Advanced imaging — prior authorization",
    service: "CPT 70553 · MRI brain without contrast",
    payerName: "Cascade Health Plan",
    denialCategory: "Prior authorization missing",
    carcCode: "CO-197",
    nextAction: "Request the authorization reference from the ordering provider",
    status: "awaiting_documents",
    updatedAt: daysAgo(3, 13, 20),
    memberId: "CSH-9920147",
    assignee: "T. Halvorsen",
    diagnoses: ["G43.909"],
    serviceDate: "2024-03-04",
    synthetic: true,
    missingDocuments: [
      {
        label: "Denial letter",
        reason: "No letter on file. The case cannot be opened from the payer reference alone.",
        requestedOn: daysAgo(3, 13, 25),
      },
      {
        label: "Ordering provider note",
        reason: "Required to identify the ordering clinician for the authorization query.",
        requestedOn: daysAgo(3, 13, 26),
      },
    ],
    documents: [],
  },
  {
    id: "aeg-2024-0170",
    reference: "AEG-2024-0170",
    title: "Behavioural health — benefit parity",
    service: "CPT 90834 · Psychotherapy, 45 minutes",
    payerName: "Northgate Mutual",
    denialCategory: "Step therapy not satisfied",
    carcCode: "CO-167",
    nextAction: "Compare medical and behavioural benefit limits side by side",
    status: "drafted",
    updatedAt: daysAgo(5, 18, 30),
    memberId: "NGM-4419188",
    assignee: "A. Costa",
    diagnoses: ["F41.1"],
    serviceDate: "2024-02-12",
    synthetic: true,
    missingDocuments: [],
    documents: [
      {
        id: "doc-0170-1",
        filename: "northgate_parity_denial.pdf",
        documentType: "denial_letter",
        uploadedAt: daysAgo(7, 9, 10),
        pageCount: 4,
      },
      {
        id: "doc-0170-2",
        filename: "behavioural_benefit_schedule.pdf",
        documentType: "supporting",
        uploadedAt: daysAgo(7, 9, 14),
        pageCount: 12,
      },
    ],
  },
];

/* ── Per-case analysis material ───────────────────────────────────────────
   Requirement identifiers for the three AcmeCare scenarios match the policy
   documents in data/synthetic/policies/. The other payers are fictional and
   their requirement identifiers are illustrative.
   -------------------------------------------------------------------------- */

export const DEMO_CASE_DETAILS: Record<string, CaseDetails> = {
  "aeg-2024-0147": {
    caseId: "aeg-2024-0147",
    policy: {
      policyId: "ACME-CGM-2024-001",
      payer: "AcmeCare Health Insurance",
      subject: "Continuous glucose monitoring coverage criteria",
    },
    denialSummary: {
      carcCode: "CO-167",
      statedReason:
        "Diagnosis(es) is (are) not covered by this payer/contractor. The requested service is not covered under policy ACME-CGM-2024-001 because required step therapy has not been documented as completed.",
      policyId: "ACME-CGM-2024-001",
      payerName: "AcmeCare Health Insurance",
      claimId: "CLM-2024-088417",
      serviceDate: "02 February 2024",
      citation: "acmecare_cgm_denial.pdf, p. 1 — “Denial Reason”",
    },
    requirements: [
      {
        id: "REQ-STEP-METFORMIN",
        description: "Documented trial of metformin for a minimum of 90 days",
        type: "Step therapy",
        evidenceRequired:
          "Dispensing record showing metformin, plus a note documenting inadequate control despite adherence, or a documented contraindication.",
        order: 1,
        status: "verified",
        citation: "ACME-CGM-2024-001 § Coverage Criteria, Prerequisite 1",
        evidenceRef: "metformin_dispensing_record.pdf",
        justification:
          "Dispensing history shows metformin 1000 mg twice daily from 14 Aug to 30 Jan, covering the required 90 days.",
      },
      {
        id: "REQ-STEP-SULFONYLUREA",
        description: "Documented trial of a second-line oral agent before CGM approval",
        type: "Step therapy",
        evidenceRequired:
          "Dispensing record showing a sulfonylurea with dates, or documented intolerance.",
        order: 2,
        status: "missing",
        citation: "ACME-CGM-2024-001 § Coverage Criteria, Prerequisite 2",
        justification:
          "No second-line agent appears anywhere in the record. This is the criterion the payer cites in its denial.",
      },
      {
        id: "REQ-HYPO-LOG",
        description: "Minimum three-month log of blood glucose readings",
        type: "Clinical documentation",
        evidenceRequired: "Readings spanning at least twelve consecutive weeks.",
        order: 0,
        status: "review",
        citation: "ACME-CGM-2024-001 § Coverage Criteria, Prerequisite 3",
        evidenceRef: "blood_glucose_log.pdf",
        justification:
          "Log is present but spans eleven weeks. Needs a reviewer decision, not an assumption.",
      },
    ],
    evidence: [
      {
        id: "ev-cgm-01",
        title:
          "Continuous glucose monitoring in adults with type 2 diabetes: a systematic review of glycaemic outcomes",
        authors: "Martens T, Okonkwo A, Reyes I, et al.",
        journal: "Diabetologia",
        year: 2023,
        doi: "10.1007/s00125-023-05987-2",
        relevance: 0.87,
        supportsRequirementId: "REQ-STEP-SULFONYLUREA",
        publicationType: "Systematic review",
        excerpt:
          "Across included trials, CGM initiation was associated with a reduction in time in range relative to self-monitoring, without a preceding oral-agent failure requirement in the majority of included protocols.",
      },
      {
        id: "ev-step-02",
        title: "Step therapy requirements and time-to-treatment in commercial insurance populations",
        authors: "Rao A, Feldman J, Lindqvist P, et al.",
        journal: "Health Affairs",
        year: 2022,
        doi: "10.1377/hlthaff.2022.0114",
        relevance: 0.79,
        supportsRequirementId: "REQ-STEP-SULFONYLUREA",
        publicationType: "Observational study",
        excerpt:
          "Sequential therapy requirements were associated with a median additional delay of 34 days before treatment initiation, concentrated in diabetes and behavioural health categories.",
      },
    ],
    trail: [
      {
        id: "t-0147-1",
        assertion:
          "The payer denied the claim under CO-167, citing policy ACME-CGM-2024-001 and an absence of documented step therapy.",
        citation: "acmecare_cgm_denial.pdf, p. 1",
        documentId: "doc-0147-1",
        strength: "supported",
      },
      {
        id: "t-0147-2",
        assertion:
          "That policy makes metformin, then a second-line oral agent, prerequisites for CGM authorisation.",
        citation: "ACME-CGM-2024-001 § Coverage Criteria, Prerequisite 1–2",
        requirementId: "REQ-STEP-SULFONYLUREA",
        strength: "supported",
      },
      {
        id: "t-0147-3",
        assertion:
          "The metformin prerequisite is met by the dispensing record already on file.",
        citation: "metformin_dispensing_record.pdf, p. 1",
        requirementId: "REQ-STEP-METFORMIN",
        documentId: "doc-0147-3",
        evidenceId: "ev-step-02",
        strength: "supported",
      },
      {
        id: "t-0147-4",
        assertion:
          "The second-line prerequisite has no supporting record. This is the specific gap the denial rests on.",
        citation: "No document in the record satisfies this requirement.",
        requirementId: "REQ-STEP-SULFONYLUREA",
        strength: "missing",
      },
    ],
  },

  "aeg-2024-0152": {
    caseId: "aeg-2024-0152",
    policy: {
      policyId: "ACME-MRI-2024-002",
      payer: "AcmeCare Health Insurance",
      subject: "MRI of the lower extremity — conservative therapy prerequisite",
    },
    denialSummary: {
      carcCode: "CO-197",
      statedReason:
        "Precertification/authorization/notification absent. No prior authorization number was recorded for this service, and the conservative therapy prerequisite could not be verified from the claims history.",
      policyId: "ACME-MRI-2024-002",
      payerName: "AcmeCare Health Insurance",
      claimId: "CLM-2024-090213",
      serviceDate: "19 February 2024",
      citation: "acmecare_mri_denial.pdf, p. 1 — “Reason for Denial”",
    },
    requirements: [
      {
        id: "REQ-PRIOR-AUTH",
        description: "Prior authorization obtained before the date of service",
        type: "Prior authorization",
        evidenceRequired:
          "Completed prior authorization request form and the authorization reference issued by the payer.",
        order: 0,
        status: "missing",
        citation: "ACME-MRI-2024-002 § Coverage Criteria, Prerequisite 1",
        justification:
          "The payer states no authorization number was recorded. The practice has no copy of the form.",
      },
      {
        id: "REQ-PHYSIO-6WK",
        description: "Six weeks of documented conservative physical therapy",
        type: "Step therapy",
        evidenceRequired:
          "Treatment notes showing attended sessions across at least six consecutive weeks.",
        order: 1,
        status: "missing",
        citation: "ACME-MRI-2024-002 § Coverage Criteria, Prerequisite 2",
        justification:
          "No treatment notes are on file. The payer asserts the requirement was not met.",
      },
      {
        id: "REQ-CLINICAL-EXAM",
        description: "Clinical examination within 60 days of the imaging date",
        type: "Clinical documentation",
        evidenceRequired:
          "Office visit note documenting the examination findings and indication for imaging.",
        order: 2,
        status: "missing",
        citation: "ACME-MRI-2024-002 § Coverage Criteria, Prerequisite 3",
        justification: "No examination note has been supplied to the case.",
      },
    ],
    evidence: [],
    trail: [
      {
        id: "t-0152-1",
        assertion:
          "The payer denied under CO-197, stating no authorization number was recorded for the date of service.",
        citation: "acmecare_mri_denial.pdf, p. 1",
        documentId: "doc-0152-1",
        strength: "supported",
      },
      {
        id: "t-0152-2",
        assertion:
          "The denial does not distinguish between an authorization that was never requested and one that was requested but not recorded. The letter is silent on which.",
        citation: "acmecare_mri_denial.pdf, p. 1 — no reference to a submission date",
        strength: "contested",
      },
      {
        id: "t-0152-3",
        assertion:
          "All three policy prerequisites are currently unsatisfied because no supporting documents have been supplied.",
        citation: "Case record contains one document.",
        strength: "missing",
      },
    ],
  },

  "aeg-2024-0158": {
    caseId: "aeg-2024-0158",
    policy: {
      policyId: "ACME-MH-2024-003",
      payer: "AcmeCare Health Insurance",
      subject: "Outpatient behavioural health session limits",
    },
    denialSummary: {
      carcCode: "CO-50",
      statedReason:
        "Non-covered services; not deemed a medical necessity. Session 21 exceeds the twenty sessions authorised per year under the behavioural health benefit and no additional clinical justification was supplied with the request.",
      policyId: "ACME-MH-2024-003",
      payerName: "AcmeCare Health Insurance",
      claimId: "CLM-2024-086640",
      serviceDate: "30 January 2024",
      citation: "acmecare_therapy_denial.pdf, p. 2 — “Adjustment Detail”",
    },
    requirements: [
      {
        id: "REQ-MH-BASELINE",
        description: "Documented diagnostic assessment establishing the behavioural health diagnosis",
        type: "Clinical documentation",
        evidenceRequired:
          "Initial assessment documenting symptom presentation, duration and functional impact.",
        order: 0,
        status: "verified",
        citation: "ACME-MH-2024-003 § Eligibility",
        evidenceRef: "progress_note_session_21.pdf",
        justification:
          "Diagnostic assessment is recorded in the case history and matches F33.1 on the claim.",
      },
      {
        id: "REQ-MH-MEDICAL-NECESSITY",
        description:
          "Additional clinical justification for sessions beyond the annual limit",
        type: "Medical necessity",
        evidenceRequired:
          "Clinical rationale for continued treatment beyond the authorised session count, with risk of deterioration if treatment stops.",
        order: 1,
        status: "review",
        citation: "ACME-MH-2024-003 § Session limits",
        evidenceRef: "progress_note_session_21.pdf",
        justification:
          "A rationale exists in the progress note but was not submitted with the request. Whether it satisfies the payer is a reviewer decision.",
      },
    ],
    evidence: [
      {
        id: "ev-parity-01",
        title:
          "Parity in mental health and substance use disorder benefits: a state-level comparison",
        authors: "Okoro ON, Alvarez M, Chen W, et al.",
        journal: "Psychiatric Services",
        year: 2023,
        doi: "10.1176/appi.ps.20230012",
        relevance: 0.74,
        supportsRequirementId: "REQ-MH-MEDICAL-NECESSITY",
        publicationType: "Policy analysis",
        excerpt:
          "Session limits observed in behavioural health benefits were, in the states examined, lower than comparable limits applied to medical surgical benefits with comparable clinical severity.",
      },
    ],
    trail: [
      {
        id: "t-0158-1",
        assertion:
          "The payer applied CO-50 because session 21 exceeded the annual authorised count of twenty.",
        citation: "acmecare_therapy_denial.pdf, p. 2",
        documentId: "doc-0158-1",
        strength: "supported",
      },
      {
        id: "t-0158-2",
        assertion:
          "The policy permits sessions beyond the limit where additional clinical justification is supplied. The denial states none accompanied the request.",
        citation: "ACME-MH-2024-003 § Session limits",
        requirementId: "REQ-MH-MEDICAL-NECESSITY",
        strength: "supported",
      },
      {
        id: "t-0158-3",
        assertion:
          "Such justification exists in the progress note but was not submitted. Whether that satisfies the payer is unresolved.",
        citation: "progress_note_session_21.pdf, p. 3",
        requirementId: "REQ-MH-MEDICAL-NECESSITY",
        documentId: "doc-0158-2",
        evidenceId: "ev-parity-01",
        strength: "contested",
      },
    ],
  },

  "aeg-2024-0161": {
    caseId: "aeg-2024-0161",
    policy: {
      policyId: "NGM-IM-2023-114",
      payer: "Northgate Mutual",
      subject: "Inpatient medical necessity determination",
    },
    denialSummary: {
      carcCode: "CO-50",
      statedReason:
        "Non-covered services; not deemed a medical necessity. Observation status was not supported by the submitted documentation; the admission H&P was not enclosed with the request.",
      policyId: "NGM-IM-2023-114",
      payerName: "Northgate Mutual",
      claimId: "NGM-2024-221904",
      serviceDate: "27 February 2024",
      citation: "northgate_observation_denial.pdf, p. 3 — “Medical Necessity Review”",
    },
    requirements: [
      {
        id: "REQ-NGM-SEVERITY",
        description: "Documented severity meeting observation criteria",
        type: "Medical necessity",
        evidenceRequired:
          "H&P documenting severity, treatment intensity and expected duration.",
        order: 1,
        status: "missing",
        citation: "NGM-IM-2023-114 § Observation criteria",
        justification: "The H&P was never enclosed with the request.",
      },
      {
        id: "REQ-NGM-ALT",
        description: "Ambulatory care evaluated and documented as insufficient",
        type: "Medical necessity",
        evidenceRequired: "Note documenting why lower-intensity care was not appropriate.",
        order: 2,
        status: "review",
        citation: "NGM-IM-2023-114 § Observation criteria",
        justification:
          "Addressed in the admission note but the payer's alternative criteria read differently. Needs reviewer comparison.",
      },
    ],
    evidence: [],
    trail: [
      {
        id: "t-0161-1",
        assertion:
          "The payer states the H&P was not enclosed. The practice's file likewise contains only the denial letter.",
        citation: "northgate_observation_denial.pdf, p. 3",
        documentId: "doc-0161-1",
        strength: "supported",
      },
      {
        id: "t-0161-2",
        assertion:
          "A second payer's policy covering the same admission sets a lower severity threshold. The two criteria are not reconciled in the case.",
        citation: "NGM-IM-2023-114 § Observation criteria",
        strength: "contested",
      },
    ],
  },

  "aeg-2024-0166": {
    caseId: "aeg-2024-0166",
    policy: {
      policyId: "CSH-IMG-2023-008",
      payer: "Cascade Health Plan",
      subject: "Advanced imaging authorisation",
    },
    denialSummary: {
      carcCode: "CO-197",
      statedReason:
        "Precertification/authorization/notification absent. No authorization reference was recorded against the imaging order.",
      policyId: "CSH-IMG-2023-008",
      payerName: "Cascade Health Plan",
      claimId: "CSH-2024-770412",
      serviceDate: "04 March 2024",
      citation: "Cascade payer portal reference — denial letter not yet on file",
    },
    requirements: [
      {
        id: "REQ-CSH-AUTH",
        description: "Authorization reference recorded before the imaging date",
        type: "Prior authorization",
        evidenceRequired:
          "Authorization reference issued by the payer, or the written response declining it.",
        order: 0,
        status: "review",
        citation: "CSH-IMG-2023-008 § Authorisation",
        justification:
          "The reference is unknown. The ordering provider has not yet confirmed whether a request was submitted.",
      },
    ],
    evidence: [],
    trail: [
      {
        id: "t-0166-1",
        assertion:
          "The case rests on a payer reference alone. No denial letter has been obtained, so the payer's stated basis has not been read.",
        citation: "Case record contains no documents.",
        strength: "missing",
      },
    ],
  },

  "aeg-2024-0170": {
    caseId: "aeg-2024-0170",
    policy: {
      policyId: "NGM-MH-2023-207",
      payer: "Northgate Mutual",
      subject: "Behavioural health benefit parity",
    },
    denialSummary: {
      carcCode: "CO-167",
      statedReason:
        "Diagnosis(es) is (are) not covered by this payer/contractor. The requested service falls under a step-therapy requirement applied to behavioural health that is not applied to comparable medical surgical services.",
      policyId: "NGM-MH-2023-207",
      payerName: "Northgate Mutual",
      claimId: "NGM-2024-219877",
      serviceDate: "12 February 2024",
      citation: "northgate_parity_denial.pdf, p. 4 — “Denial Reason”",
    },
    requirements: [
      {
        id: "REQ-NGM-PARITY",
        description: "Behavioural and medical benefit limits applied consistently",
        type: "Policy",
        evidenceRequired:
          "Side-by-side comparison of the behavioural health and medical surgical benefit schedules.",
        order: 0,
        status: "verified",
        citation: "NGM-MH-2023-207 § Parity",
        evidenceRef: "behavioural_benefit_schedule.pdf",
        justification:
          "Both schedules are on file. The behavioural limit is 12 sessions against a medical equivalent of 30.",
      },
      {
        id: "REQ-NGM-STEP",
        description: "Step therapy applied consistently across benefit categories",
        type: "Step therapy",
        evidenceRequired:
          "Policy text showing whether step therapy applies to comparable medical services.",
        order: 1,
        status: "review",
        citation: "NGM-MH-2023-207 § Step therapy",
        justification:
          "The schedule excerpt does not state whether medical services carry the same requirement. A legal question, not a clinical one.",
      },
    ],
    evidence: [
      {
        id: "ev-parity-02",
        title: "Parity in mental health and substance use disorder benefits: a state-level comparison",
        authors: "Okoro ON, Alvarez M, Chen W, et al.",
        journal: "Psychiatric Services",
        year: 2023,
        doi: "10.1176/appi.ps.20230012",
        relevance: 0.81,
        supportsRequirementId: "REQ-NGM-PARITY",
        publicationType: "Policy analysis",
        excerpt:
          "Session limits observed in behavioural health benefits were, in the states examined, lower than comparable limits applied to medical surgical benefits with comparable clinical severity.",
      },
    ],
    trail: [
      {
        id: "t-0170-1",
        assertion:
          "The payer applied CO-167 by extending a step-therapy requirement to a behavioural health service.",
        citation: "northgate_parity_denial.pdf, p. 4",
        documentId: "doc-0170-1",
        strength: "supported",
      },
      {
        id: "t-0170-2",
        assertion:
          "Both benefit schedules are on file and show a 12-session behavioural limit against a 30-session medical equivalent.",
        citation: "behavioural_benefit_schedule.pdf, §§2–3",
        requirementId: "REQ-NGM-PARITY",
        documentId: "doc-0170-2",
        evidenceId: "ev-parity-02",
        strength: "supported",
      },
      {
        id: "t-0170-3",
        assertion:
          "Whether the step-therapy requirement is itself applied consistently is a policy question the record does not settle.",
        citation: "NGM-MH-2023-207 § Step therapy — no equivalent medical provision located",
        requirementId: "REQ-NGM-STEP",
        strength: "contested",
      },
    ],
  },
};

/* ── Policy index (structural placeholder until Phase 6 exposes it) ───────── */

export const DEMO_POLICIES = [
  {
    policyId: "ACME-CGM-2024-001",
    payer: "AcmeCare Health Insurance",
    subject: "Continuous glucose monitoring coverage criteria",
    requirements: 3,
  },
  {
    policyId: "ACME-MRI-2024-002",
    payer: "AcmeCare Health Insurance",
    subject: "MRI of lower extremity — conservative therapy prerequisite",
    requirements: 3,
  },
  {
    policyId: "ACME-MH-2024-003",
    payer: "AcmeCare Health Insurance",
    subject: "Outpatient behavioural health session limits",
    requirements: 2,
  },
  {
    policyId: "NGM-IM-2023-114",
    payer: "Northgate Mutual",
    subject: "Inpatient medical necessity determination",
    requirements: 2,
  },
  {
    policyId: "NGM-MH-2023-207",
    payer: "Northgate Mutual",
    subject: "Behavioural health benefit parity",
    requirements: 2,
  },
  {
    policyId: "CSH-IMG-2023-008",
    payer: "Cascade Health Plan",
    subject: "Advanced imaging authorisation",
    requirements: 1,
  },
] as const;

/** Look up a case by id, falling back to the first record. */
export function findCase(caseId: string | undefined): CaseRecord {
  return (
    DEMO_CASES.find((record) => record.id === caseId) ?? DEMO_CASES[0]
  );
}

/** Analysis material for a case. Null when the case has no detail record. */
export function findCaseDetails(caseId: string | undefined): CaseDetails | null {
  if (!caseId) return null;
  return DEMO_CASE_DETAILS[caseId] ?? null;
}

/** Requirements for a case, or an empty list when none are on file. */
export function requirementsFor(caseId: string | undefined): Requirement[] {
  return findCaseDetails(caseId)?.requirements ?? [];
}

/**
 * Every retrieved evidence record across the workspace, for screens that show
 * the corpus rather than one case's slice of it.
 */
export function allEvidence(): EvidenceItem[] {
  return Object.values(DEMO_CASE_DETAILS).flatMap((details) => details.evidence);
}

/** Requirement identifiers referenced anywhere in the workspace. */
export function allRequirements(): Requirement[] {
  return Object.values(DEMO_CASE_DETAILS).flatMap((details) => details.requirements);
}

/** Evidence records for a case. */
export function evidenceFor(caseId: string | undefined): EvidenceItem[] {
  return findCaseDetails(caseId)?.evidence ?? [];
}

/** Compact counters for the overview header. Not KPI cards — inline figures. */
export function summariseCases(cases: CaseRecord[]) {
  return {
    total: cases.length,
    awaitingDocuments: cases.filter((c) => c.status === "awaiting_documents").length,
    inReview: cases.filter((c) => c.status === "in_review").length,
    readyForReview: cases.filter((c) => c.status === "ready_for_review").length,
  };
}

/** Total requested-but-absent documents across the queue. */
export function countMissingDocuments(cases: CaseRecord[]): number {
  return cases.reduce((total, record) => total + record.missingDocuments.length, 0);
}