"""
Tests for Phase 4 — Document Upload & Text Extraction.

Test matrix:
  ✅ test_upload_pdf_returns_200           → Happy path: upload works
  ✅ test_upload_extracts_scenario1_codes  → Key terms found in extracted text
  ✅ test_upload_extracts_scenario2_codes  → Scenario 2 key terms
  ✅ test_upload_extracts_scenario3_codes  → Scenario 3 key terms
  ✅ test_upload_all_scenarios_succeed     → All 3 PDFs parse without error
  ✅ test_upload_rejects_unsupported_type  → JPEG upload returns 415
  ✅ test_upload_saves_files_to_disk       → Both raw + JSON files created
  ✅ test_upload_text_file                 → Plain .txt upload works
"""

from pathlib import Path
import json

import pytest
from fastapi.testclient import TestClient

from aegis.api.main import app

client = TestClient(app)

# Path to our synthetic denial PDFs generated in Phase 0
DENIAL_PDFS_DIR = (
    Path(__file__).resolve().parents[1] / "data" / "synthetic" / "denial_letters"
)


# ─── Helper ──────────────────────────────────────────────────────────────

def upload_pdf(filename: str) -> dict:
    """Upload a PDF from the synthetic denial letters directory."""
    pdf_path = DENIAL_PDFS_DIR / filename
    assert pdf_path.exists(), f"Test fixture missing: {pdf_path}"

    with open(pdf_path, "rb") as f:
        response = client.post(
            "/api/v1/documents/upload",
            files={"file": (filename, f, "application/pdf")},
        )

    assert response.status_code == 200, f"Upload failed: {response.text}"
    return response.json()


def get_full_text(document_id: str) -> str:
    """Read the full extracted text from the saved JSON file."""
    from aegis.api.routes.documents import _get_extracted_dir

    extracted_path = _get_extracted_dir() / f"{document_id}.json"
    assert extracted_path.exists(), f"Extracted JSON not found: {extracted_path}"

    data = json.loads(extracted_path.read_text(encoding="utf-8"))
    return data["full_text"]


# ─── Tests ───────────────────────────────────────────────────────────────


class TestUploadHappyPath:
    """Test that basic upload + extraction works."""

    def test_upload_pdf_returns_200(self):
        """Uploading a valid PDF should return 200 with correct fields."""
        data = upload_pdf("scenario_1_denial.pdf")

        # Check all expected fields are present
        assert "document_id" in data
        assert data["filename"] == "scenario_1_denial.pdf"
        assert data["content_type"] == "application/pdf"
        assert data["page_count"] >= 1
        assert len(data["extracted_text_preview"]) > 0

    def test_upload_all_scenarios_succeed(self):
        """All 3 denial PDFs should upload and parse without errors."""
        for i in range(1, 4):
            data = upload_pdf(f"scenario_{i}_denial.pdf")
            assert data["page_count"] >= 1, f"Scenario {i}: no pages extracted"
            assert len(data["extracted_text_preview"]) > 50, (
                f"Scenario {i}: extracted text too short"
            )


class TestExtractionAccuracy:
    """
    Test that the extracted text contains the key terms we expect.

    These tests validate that PyMuPDF correctly reads the text layer
    from our synthetic PDFs. The exact codes must be present because
    Phase 5 (NER) will need to find them.
    """

    def test_upload_extracts_scenario1_codes(self):
        """
        Scenario 1 denial letter should contain:
          - ICD-10: E11.9 (Type 2 Diabetes)
          - CPT: 95251 (CGM)
          - CARC: CO-167 (diagnosis not covered)
          - Patient: Maria Gonzalez
          - Policy: ACME-CGM-2024-001
        """
        data = upload_pdf("scenario_1_denial.pdf")
        full_text = get_full_text(data["document_id"])

        assert "E11.9" in full_text, "ICD-10 code E11.9 not found"
        assert "95251" in full_text, "CPT code 95251 not found"
        assert "CO-167" in full_text, "CARC code CO-167 not found"
        assert "Maria Gonzalez" in full_text, "Patient name not found"
        assert "ACME-CGM-2024-001" in full_text, "Policy ID not found"

    def test_upload_extracts_scenario2_codes(self):
        """
        Scenario 2 denial letter should contain:
          - ICD-10: M25.561 (knee pain)
          - CPT: 73721 (MRI)
          - CARC: CO-197 (prior auth missing)
          - Patient: James Chen
        """
        data = upload_pdf("scenario_2_denial.pdf")
        full_text = get_full_text(data["document_id"])

        assert "M25.561" in full_text, "ICD-10 code M25.561 not found"
        assert "73721" in full_text, "CPT code 73721 not found"
        assert "CO-197" in full_text, "CARC code CO-197 not found"
        assert "James Chen" in full_text, "Patient name not found"

    def test_upload_extracts_scenario3_codes(self):
        """
        Scenario 3 denial letter should contain:
          - ICD-10: F33.1 (MDD)
          - CPT: 90837 (psychotherapy)
          - CARC: CO-50 (medical necessity)
          - Patient: Aisha Williams
          - Legal reference: MHPAEA
        """
        data = upload_pdf("scenario_3_denial.pdf")
        full_text = get_full_text(data["document_id"])

        assert "F33.1" in full_text, "ICD-10 code F33.1 not found"
        assert "90837" in full_text, "CPT code 90837 not found"
        assert "CO-50" in full_text, "CARC code CO-50 not found"
        assert "Aisha Williams" in full_text, "Patient name not found"
        assert "MHPAEA" in full_text, "Legal reference MHPAEA not found"


class TestValidation:
    """Test input validation and error handling."""

    def test_upload_rejects_unsupported_type(self):
        """Uploading a JPEG should return HTTP 415 (Unsupported Media Type)."""
        response = client.post(
            "/api/v1/documents/upload",
            files={"file": ("photo.jpg", b"fake image data", "image/jpeg")},
        )
        assert response.status_code == 415
        assert "Unsupported" in response.json()["detail"]

    def test_upload_rejects_docx(self):
        """Uploading a DOCX should return HTTP 415."""
        response = client.post(
            "/api/v1/documents/upload",
            files={
                "file": (
                    "document.docx",
                    b"fake docx",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
            },
        )
        assert response.status_code == 415


class TestFilePersistence:
    """Test that files are correctly saved to disk."""

    def test_upload_saves_files_to_disk(self):
        """Both the raw upload and extracted JSON should be written."""
        data = upload_pdf("scenario_2_denial.pdf")
        doc_id = data["document_id"]

        from aegis.api.routes.documents import _get_upload_dir, _get_extracted_dir

        # Check raw upload file exists
        upload_files = list(_get_upload_dir().glob(f"{doc_id}*"))
        assert len(upload_files) == 1, "Raw upload file not saved to disk"

        # Check extracted JSON exists
        extracted_path = _get_extracted_dir() / f"{doc_id}.json"
        assert extracted_path.exists(), "Extracted JSON not saved to disk"

        # Verify the JSON is valid and contains expected fields
        content = json.loads(extracted_path.read_text(encoding="utf-8"))
        assert content["document_id"] == doc_id
        assert content["filename"] == "scenario_2_denial.pdf"
        assert len(content["full_text"]) > 0
        assert len(content["pages"]) >= 1

    def test_upload_text_file(self):
        """Plain text file upload should also work."""
        test_text = "This is a test denial letter.\nDiagnosis: E11.9\nCPT: 95251"

        response = client.post(
            "/api/v1/documents/upload",
            files={"file": ("test.txt", test_text.encode(), "text/plain")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["content_type"] == "text/plain"
        assert data["page_count"] == 1
        assert "E11.9" in data["extracted_text_preview"]