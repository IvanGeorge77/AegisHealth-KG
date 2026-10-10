"""
Entity extraction endpoint.

Route: POST /api/v1/documents/{document_id}/extract
Reads the previously extracted text from data/extracted/{document_id}.json,
runs the NER pipeline, and returns structured entities.
"""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

from aegis.config.settings import get_settings
from aegis.extraction.ner import extract_entities
from aegis.models.document import ExtractionResult
from aegis.models.entities import ExtractionResponse

router = APIRouter(prefix="/api/v1/documents", tags=["extraction"])


@router.post("/{document_id}/extract", response_model=ExtractionResponse)
async def extract_document_entities(
    document_id: str,
    use_model: bool = Query(
        default=False,
        description="If true, also run the HuggingFace NER model (slower, requires ~400MB download on first use)",
    ),
):
    """
    Extract biomedical and administrative entities from a previously uploaded document.

    Prerequisites:
      - The document must have been uploaded via POST /api/v1/documents/upload first.
      - This reads from data/extracted/{document_id}.json

    Returns structured entities: ICD-10 codes, CPT codes, CARC denial codes,
    payer name, provider NPI, member ID, claim ID, policy ID.
    """
    # ── Load the previously extracted text ──
    extracted_dir = get_settings().data_dir / "extracted"
    extracted_path = extracted_dir / f"{document_id}.json"

    if not extracted_path.exists():
        raise HTTPException(
            status_code=404,
            detail=(
                f"Document '{document_id}' not found. "
                f"Upload it first via POST /api/v1/documents/upload"
            ),
        )

    # Parse the saved extraction result
    raw_json = extracted_path.read_text(encoding="utf-8")
    extraction = ExtractionResult.model_validate_json(raw_json)

    # ── Run NER pipeline ──
    entities = extract_entities(extraction.full_text, use_model=use_model)

    # ── Count total entities ──
    entity_count = (
        len(entities.icd10_codes)
        + len(entities.cpt_codes)
        + len(entities.denial_codes)
        + (1 if entities.payer_name else 0)
        + (1 if entities.provider_npi else 0)
        + (1 if entities.member_id else 0)
        + (1 if entities.claim_id else 0)
        + (1 if entities.policy_id else 0)
    )

    return ExtractionResponse(
        document_id=document_id,
        filename=extraction.filename,
        entities=entities,
        raw_entity_count=entity_count,
    )