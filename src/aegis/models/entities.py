"""
Pydantic models for the NER extraction output.

ExtractedEntities  → the structured result of running NER on a denial letter.
EntitySpan         → a single extracted entity with its source location.
ExtractionResponse → the API response wrapping ExtractedEntities with metadata.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class EntitySpan(BaseModel):
    """A single entity extracted from the document text."""
    text: str = Field(..., description="The raw text as found in the document")
    normalized: str = Field(..., description="Cleaned/normalized value (e.g. 'E11.9' not 'E11. 9')")
    category: str = Field(..., description="Entity type: 'icd10', 'cpt', 'carc', 'payer', 'npi', 'member_id', 'claim_id'")
    source: str = Field(
        default="regex",
        description="How this entity was found: 'regex', 'ner_model', or 'both'"
    )
    start_char: int | None = Field(default=None, description="Character offset start in the document text")
    end_char: int | None = Field(default=None, description="Character offset end in the document text")


class ExtractedEntities(BaseModel):
    """All entities extracted from a single denial letter."""
    icd10_codes: list[EntitySpan] = Field(default_factory=list, description="ICD-10 diagnosis codes")
    cpt_codes: list[EntitySpan] = Field(default_factory=list, description="CPT/HCPCS procedure codes")
    denial_codes: list[EntitySpan] = Field(default_factory=list, description="CARC denial reason codes (CO-xxx, PR-xxx)")
    payer_name: str | None = Field(default=None, description="Insurance company name")
    provider_npi: str | None = Field(default=None, description="Rendering provider NPI number")
    member_id: str | None = Field(default=None, description="Patient's insurance member ID")
    claim_id: str | None = Field(default=None, description="The denied claim number")
    policy_id: str | None = Field(default=None, description="Policy identifier referenced in the denial")

    # Convenience properties for downstream consumers (Phase 6)
    @property
    def icd10_list(self) -> list[str]:
        """Just the normalized ICD-10 codes as strings."""
        return [e.normalized for e in self.icd10_codes]

    @property
    def cpt_list(self) -> list[str]:
        """Just the normalized CPT codes as strings."""
        return [e.normalized for e in self.cpt_codes]

    @property
    def carc_list(self) -> list[str]:
        """Just the normalized CARC codes as strings."""
        return [e.normalized for e in self.denial_codes]


class ExtractionResponse(BaseModel):
    """API response for the extraction endpoint."""
    document_id: str
    filename: str
    entities: ExtractedEntities
    raw_entity_count: int = Field(..., description="Total number of individual entities extracted")