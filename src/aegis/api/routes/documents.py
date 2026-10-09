"""
Document upload & text extraction endpoint.

Route: POST /api/v1/documents/upload
Accepts: multipart/form-data with a "file" field
Returns: UploadResponse JSON

This endpoint does 4 things in sequence:
  1. Validates the file (type check, size check)
  2. Saves the raw uploaded file to data/uploads/{document_id}.{ext}
  3. Calls the parser to extract text from the file
  4. Saves the full extraction result to data/extracted/{document_id}.json
  5. Returns a preview response to the caller
"""

from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File

from aegis.config.settings import get_settings
from aegis.extraction.parser import extract_text
from aegis.models.document import ExtractionResult, UploadResponse

# ─── Router Setup ────────────────────────────────────────────────────────
#
# prefix="/api/v1/documents" means all routes in this file start with
# that path. So the function decorated with @router.post("/upload")
# becomes: POST /api/v1/documents/upload
#
# tags=["documents"] groups this endpoint under "documents" in the
# auto-generated Swagger docs at /docs

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])

# ─── Constants ───────────────────────────────────────────────────────────

# Which file types we accept. Our parser only supports these two.
# If someone uploads a .jpg or .docx, we reject it immediately.
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "text/plain",
}

# Safety limit — prevent someone from uploading a 500MB file
MAX_FILE_SIZE_MB = 20


# ─── Helpers ─────────────────────────────────────────────────────────────

def _get_upload_dir() -> Path:
    """Get the uploads directory path from settings."""
    return get_settings().data_dir / "uploads"


def _get_extracted_dir() -> Path:
    """Get the extracted directory path from settings."""
    return get_settings().data_dir / "extracted"


# ─── Endpoint ────────────────────────────────────────────────────────────

@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document (PDF or TXT), extract its text, and return a summary.

    The full pipeline:

    ```
    User uploads file
         │
         ├── 1. Content-Type check  → 415 if unsupported
         ├── 2. File size check     → 413 if too large
         ├── 3. Save raw file       → data/uploads/{uuid}.pdf
         ├── 4. Extract text        → parser.extract_text()
         ├── 5. Save extraction     → data/extracted/{uuid}.json
         └── 6. Return preview      → UploadResponse JSON
    ```

    Args:
        file: The uploaded file (multipart/form-data).
              FastAPI automatically parses this from the request body.
              The `File(...)` means it's required (not optional).

    Returns:
        UploadResponse with document_id, filename, page_count, and text preview.

    Raises:
        HTTPException 415: Unsupported file type
        HTTPException 413: File too large
        HTTPException 422: Text extraction failed
    """

    # ── Step 1: Validate content type ────────────────────────────────
    #
    # file.content_type is set by the client's browser or curl.
    # Example values: "application/pdf", "text/plain", "image/jpeg"
    #
    # We only accept PDF and TXT. Everything else gets a 415
    # (Unsupported Media Type) error.

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type: '{file.content_type}'. "
                f"Allowed types: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}"
            ),
        )

    # ── Step 2: Read file contents & check size ──────────────────────
    #
    # await file.read() reads the entire file into memory as bytes.
    # We then check if it's within our size limit.
    #
    # For a production system, you'd stream the file to disk chunk-by-chunk
    # to avoid memory issues. For our prototype with small PDFs, this is fine.

    contents = await file.read()

    size_limit_bytes = MAX_FILE_SIZE_MB * 1024 * 1024  # Convert MB to bytes
    if len(contents) > size_limit_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size: {MAX_FILE_SIZE_MB} MB.",
        )

    # ── Step 3: Generate document ID & save raw file ─────────────────
    #
    # Each upload gets a UUID (universally unique identifier).
    # Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    #
    # The raw file is saved as: data/uploads/{uuid}.pdf
    # This preserves the original file for future reference.

    document_id = str(uuid.uuid4())

    # Get file extension from original filename (default to .bin if missing)
    suffix = Path(file.filename).suffix if file.filename else ".bin"

    upload_dir = _get_upload_dir()
    upload_dir.mkdir(parents=True, exist_ok=True)  # Create dir if missing

    upload_path = upload_dir / f"{document_id}{suffix}"
    upload_path.write_bytes(contents)  # Write raw bytes to disk

    # ── Step 4: Extract text ─────────────────────────────────────────
    #
    # Call our parser module. It returns:
    #   - full_text:  all pages joined as one string
    #   - pages:      list of per-page text strings
    #   - page_count: number of pages
    #
    # If extraction fails (e.g., corrupted PDF), we catch the error
    # and return a 422 (Unprocessable Entity).

    try:
        full_text, pages, page_count = extract_text(upload_path, file.content_type)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to extract text from '{file.filename}': {exc}",
        )

    # ── Step 5: Save extraction result to disk ───────────────────────
    #
    # The full extracted text is saved as JSON in data/extracted/{uuid}.json
    # This is the file that Phase 5 (NER) will read from.
    #
    # We use Pydantic's model_dump_json() to serialize to JSON with
    # proper formatting (indent=2 for readability).

    result = ExtractionResult(
        document_id=document_id,
        filename=file.filename or "unknown",
        content_type=file.content_type,
        page_count=page_count,
        full_text=full_text,
        pages=pages,
    )

    extracted_dir = _get_extracted_dir()
    extracted_dir.mkdir(parents=True, exist_ok=True)

    extracted_path = extracted_dir / f"{document_id}.json"
    extracted_path.write_text(
        result.model_dump_json(indent=2),
        encoding="utf-8",
    )

    # ── Step 6: Return preview response ──────────────────────────────
    #
    # We return only the first 500 characters of the extracted text.
    # The full text is available in the saved JSON file.
    #
    # response_model=UploadResponse in the decorator tells FastAPI
    # to validate the response against this Pydantic model and
    # generate proper OpenAPI docs.

    return UploadResponse(
        document_id=document_id,
        filename=file.filename or "unknown",
        content_type=file.content_type,
        page_count=page_count,
        extracted_text_preview=full_text[:500],
    )