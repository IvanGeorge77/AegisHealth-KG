"""
Pydantic models for the document upload & extraction pipeline.

UploadResponse  → sent back to the API caller (contains a text preview).
ExtractionResult → saved to data/extracted/{id}.json (contains full text).
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    """
    HTTP response returned after a successful document upload + extraction.

    This is what the user sees when they call POST /api/v1/documents/upload.
    It intentionally contains only a PREVIEW (first 500 chars) of the extracted
    text — the full text is saved to disk separately.
    """

    document_id: str = Field(
        ...,
        description="UUID assigned to this upload. Use this ID in future API calls.",
        examples=["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
    )
    filename: str = Field(
        ...,
        description="Original filename as uploaded by the user.",
        examples=["scenario_1_denial.pdf"],
    )
    content_type: str = Field(
        ...,
        description="MIME type of the uploaded file.",
        examples=["application/pdf"],
    )
    page_count: int = Field(
        ...,
        description="Number of pages extracted. Always 1 for plain text files.",
        examples=[1],
    )
    extracted_text_preview: str = Field(
        ...,
        description="First 500 characters of the extracted text.",
    )


class ExtractionResult(BaseModel):
    """
    Complete extraction output that gets persisted to disk as JSON.

    Path: data/extracted/{document_id}.json

    This is the input for Phase 5 (NER extraction). The `full_text` field
    contains the entire document text, and `pages` contains per-page text
    for PDFs (useful for locating which page a code appeared on).
    """

    document_id: str
    filename: str
    content_type: str
    page_count: int

    full_text: str = Field(
        ...,
        description="Complete extracted and cleaned text from all pages.",
    )
    pages: list[str] = Field(
        default_factory=list,
        description=(
            "Per-page text list. Index 0 = page 1, index 1 = page 2, etc. "
            "Empty list for non-PDF files."
        ),
    )