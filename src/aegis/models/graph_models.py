"""
Pydantic models defining every node and edge type in the AegisHealth Knowledge Graph.

Node types:
    - Diagnosis: ICD-10 coded condition
    - Procedure: CPT/HCPCS coded medical procedure
    - PolicyRule: Insurance policy governing coverage for a procedure
    - Requirement: Specific prerequisite within a policy rule
    - Patient: Synthetic patient record
    - Payer: Insurance company
    - Statute: Legal/regulatory reference cited by a policy

Edge types:
    - INDICATED_FOR: Diagnosis → Procedure
    - COVERED_BY: Procedure → PolicyRule
    - REQUIRES: PolicyRule → Requirement
    - PRECEDES: Requirement → Requirement (step therapy ordering)
    - HAS_CLAIM_FOR: Patient → Procedure
    - ISSUED: Payer → PolicyRule
    - REFERENCES_STATUTE: PolicyRule → Statute
"""

from __future__ import annotations

from enum import Enum
from pydantic import BaseModel, Field


# ── Enums ────────────────────────────────────────────────────────────────────

class DenialCategory(str, Enum):
    """Mock denial categories used for routing in the Knowledge Graph."""
    STEP_THERAPY_NOT_SATISFIED = "STEP_THERAPY_NOT_SATISFIED"
    PRIOR_AUTH_MISSING = "PRIOR_AUTH_MISSING"
    MEDICAL_NECESSITY_NOT_ESTABLISHED = "MEDICAL_NECESSITY_NOT_ESTABLISHED"


class RequirementType(str, Enum):
    """Classifies what kind of prerequisite a Requirement node represents."""
    STEP_THERAPY = "STEP_THERAPY"
    PRIOR_AUTHORIZATION = "PRIOR_AUTHORIZATION"
    CLINICAL_DOCUMENTATION = "CLINICAL_DOCUMENTATION"
    MEDICAL_NECESSITY = "MEDICAL_NECESSITY"


# ── Node Models ──────────────────────────────────────────────────────────────

class DiagnosisNode(BaseModel):
    """An ICD-10 coded diagnosis."""
    code: str = Field(..., description="ICD-10-CM code, e.g. 'E11.9'")
    description: str = Field(..., description="Human-readable description")
    category: str = Field(..., description="ICD-10 category, e.g. 'E11'")
    chapter: str = Field(..., description="ICD-10 chapter number")

    @property
    def neo4j_label(self) -> str:
        return "Diagnosis"


class ProcedureNode(BaseModel):
    """A CPT/HCPCS coded medical procedure."""
    code: str = Field(..., description="CPT or HCPCS code, e.g. '95251'")
    code_type: str = Field(default="CPT", description="'CPT' or 'HCPCS'")
    description: str = Field(..., description="Short description of the procedure")
    category: str = Field(..., description="Procedure category, e.g. 'Medicine'")
    requires_prior_auth: bool = Field(default=False)

    @property
    def neo4j_label(self) -> str:
        return "Procedure"


class PolicyRuleNode(BaseModel):
    """An insurance policy governing coverage criteria for a procedure."""
    policy_id: str = Field(..., description="Unique policy identifier, e.g. 'ACME-CGM-2024-001'")
    payer_name: str = Field(..., description="Name of the insurance company")
    description: str = Field(..., description="What this policy covers")
    denial_category: DenialCategory = Field(..., description="The mock denial category this policy maps to")
    carc_code: str = Field(..., description="CARC code associated with denial, e.g. 'CO-167'")
    effective_date: str = Field(default="2024-01-01")

    @property
    def neo4j_label(self) -> str:
        return "PolicyRule"


class RequirementNode(BaseModel):
    """A specific prerequisite within a PolicyRule that must be satisfied."""
    requirement_id: str = Field(..., description="Unique requirement ID, e.g. 'REQ-STEP-METFORMIN'")
    description: str = Field(..., description="What must be documented/satisfied")
    requirement_type: RequirementType = Field(..., description="Category of requirement")
    evidence_required: str = Field(..., description="What documentation satisfies this requirement")
    order: int = Field(default=0, description="Order in step therapy sequence (0 if not sequential)")

    @property
    def neo4j_label(self) -> str:
        return "Requirement"


class PatientNode(BaseModel):
    """A synthetic patient record."""
    patient_id: str = Field(..., description="Synthetic patient ID, e.g. 'SYN-PAT-001'")
    first_name: str
    last_name: str
    member_id: str = Field(..., description="Insurance member ID")
    claim_id: str = Field(..., description="The denied claim ID")
    scenario: int = Field(..., description="Which scenario this patient belongs to (1, 2, or 3)")

    @property
    def neo4j_label(self) -> str:
        return "Patient"


class PayerNode(BaseModel):
    """An insurance company."""
    name: str = Field(..., description="Payer name, e.g. 'AcmeCare Health Insurance'")
    payer_id: str = Field(..., description="Short identifier, e.g. 'ACMECARE'")

    @property
    def neo4j_label(self) -> str:
        return "Payer"


class StatuteNode(BaseModel):
    """A legal or regulatory reference cited by a policy."""
    citation: str = Field(..., description="Full citation text, e.g. 'State Insurance Code §4521.3'")
    short_name: str = Field(..., description="Short label, e.g. '§4521.3'")
    description: str = Field(..., description="What the statute covers")

    @property
    def neo4j_label(self) -> str:
        return "Statute"


# ── Edge Models ──────────────────────────────────────────────────────────────
# These are used for documentation and seed script clarity.
# Neo4j doesn't need Pydantic models for relationships, but having them
# helps us stay consistent.

class Edge(BaseModel):
    """Base model for a directed edge in the Knowledge Graph."""
    edge_type: str = Field(..., description="Relationship type, e.g. 'INDICATED_FOR'")
    from_label: str = Field(..., description="Source node label")
    from_key: str = Field(..., description="Source node unique key value")
    to_label: str = Field(..., description="Target node label")
    to_key: str = Field(..., description="Target node unique key value")
    properties: dict = Field(default_factory=dict, description="Optional edge properties")