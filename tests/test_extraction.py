"""
Unit tests for Phase 5 — Biomedical NER Pipeline.

Tests the NER pipeline against all 3 denial letter scenarios.
Each test verifies that the regex extraction finds the expected codes
from the answer keys.
"""

import json
from pathlib import Path

import pytest

from aegis.extraction.ner import extract_entities


# ─── Fixtures ────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def _load_extracted_text(scenario: int) -> str:
    """Load extracted text from a denial letter.
    
    Since extracted texts are stored with UUIDs, we need to find
    the right file. We search by filename in the JSON.
    """
    extracted_dir = DATA_DIR / "extracted"
    target_filename = f"scenario_{scenario}_denial.pdf"
    
    for json_file in extracted_dir.glob("*.json"):
        if json_file.name == ".gitkeep":
            continue
        data = json.loads(json_file.read_text(encoding="utf-8"))
        if data.get("filename") == target_filename:
            return data["full_text"]
    
    pytest.skip(f"No extracted text found for {target_filename}. Upload it first.")


def _load_answer_key(scenario: int) -> dict:
    """Load the expected answer key for a scenario."""
    path = DATA_DIR / "synthetic" / "answer_keys" / f"scenario_{scenario}_expected.json"
    return json.loads(path.read_text(encoding="utf-8"))


# ─── Tests ───────────────────────────────────────────────────────────────

class TestScenario1:
    """Scenario 1: Type 2 Diabetes → CGM (Step Therapy)"""

    def test_icd10_extraction(self):
        text = _load_extracted_text(1)
        answer = _load_answer_key(1)
        entities = extract_entities(text)
        
        expected_icd10 = set(answer["expected_entities"]["icd10"])
        extracted_icd10 = set(entities.icd10_list)
        
        assert expected_icd10.issubset(extracted_icd10), (
            f"Missing ICD-10 codes: {expected_icd10 - extracted_icd10}"
        )

    def test_cpt_extraction(self):
        text = _load_extracted_text(1)
        answer = _load_answer_key(1)
        entities = extract_entities(text)
        
        expected_cpt = set(answer["expected_entities"]["cpt"])
        extracted_cpt = set(entities.cpt_list)
        
        assert expected_cpt.issubset(extracted_cpt), (
            f"Missing CPT codes: {expected_cpt - extracted_cpt}"
        )

    def test_carc_extraction(self):
        text = _load_extracted_text(1)
        answer = _load_answer_key(1)
        entities = extract_entities(text)
        
        expected_carc = set(answer["expected_entities"]["carc"])
        extracted_carc = set(entities.carc_list)
        
        assert expected_carc.issubset(extracted_carc), (
            f"Missing CARC codes: {expected_carc - extracted_carc}"
        )

    def test_payer_extracted(self):
        text = _load_extracted_text(1)
        entities = extract_entities(text)
        assert entities.payer_name is not None
        assert "AcmeCare" in entities.payer_name or "Acme" in entities.payer_name

    def test_no_spurious_icd10(self):
        """Ensure no extra ICD-10 codes are invented."""
        text = _load_extracted_text(1)
        answer = _load_answer_key(1)
        entities = extract_entities(text)
        
        expected_icd10 = set(answer["expected_entities"]["icd10"])
        extracted_icd10 = set(entities.icd10_list)
        
        # There should be no codes beyond what's expected
        spurious = extracted_icd10 - expected_icd10
        assert len(spurious) == 0, f"Spurious ICD-10 codes extracted: {spurious}"


class TestScenario2:
    """Scenario 2: Knee Pain → MRI (Prior Auth Missing)"""

    def test_icd10_extraction(self):
        text = _load_extracted_text(2)
        answer = _load_answer_key(2)
        entities = extract_entities(text)
        
        expected_icd10 = set(answer["expected_entities"]["icd10"])
        extracted_icd10 = set(entities.icd10_list)
        assert expected_icd10.issubset(extracted_icd10)

    def test_cpt_extraction(self):
        text = _load_extracted_text(2)
        answer = _load_answer_key(2)
        entities = extract_entities(text)
        
        expected_cpt = set(answer["expected_entities"]["cpt"])
        extracted_cpt = set(entities.cpt_list)
        assert expected_cpt.issubset(extracted_cpt)

    def test_carc_extraction(self):
        text = _load_extracted_text(2)
        answer = _load_answer_key(2)
        entities = extract_entities(text)
        
        expected_carc = set(answer["expected_entities"]["carc"])
        extracted_carc = set(entities.carc_list)
        assert expected_carc.issubset(extracted_carc)


class TestScenario3:
    """Scenario 3: MDD → Outpatient Therapy (Medical Necessity)"""

    def test_icd10_extraction(self):
        text = _load_extracted_text(3)
        answer = _load_answer_key(3)
        entities = extract_entities(text)
        
        expected_icd10 = set(answer["expected_entities"]["icd10"])
        extracted_icd10 = set(entities.icd10_list)
        assert expected_icd10.issubset(extracted_icd10)

    def test_cpt_extraction(self):
        text = _load_extracted_text(3)
        answer = _load_answer_key(3)
        entities = extract_entities(text)
        
        expected_cpt = set(answer["expected_entities"]["cpt"])
        extracted_cpt = set(entities.cpt_list)
        assert expected_cpt.issubset(extracted_cpt)

    def test_carc_extraction(self):
        text = _load_extracted_text(3)
        answer = _load_answer_key(3)
        entities = extract_entities(text)
        
        expected_carc = set(answer["expected_entities"]["carc"])
        extracted_carc = set(entities.carc_list)
        assert expected_carc.issubset(extracted_carc)


class TestRegexPatterns:
    """Test regex patterns against known code strings."""

    def test_icd10_inline(self):
        text = "Diagnosis Code: E11.9 - Type 2 Diabetes"
        entities = extract_entities(text)
        assert "E11.9" in entities.icd10_list

    def test_cpt_inline(self):
        text = "Procedure Code: CPT 95251 - Continuous Glucose Monitoring"
        entities = extract_entities(text)
        assert "95251" in entities.cpt_list

    def test_carc_inline(self):
        text = "Denial Reason Code: CO-167"
        entities = extract_entities(text)
        assert "CO-167" in entities.carc_list

    def test_carc_co50(self):
        text = "Denied under CO-50 due to medical necessity"
        entities = extract_entities(text)
        assert "CO-50" in entities.carc_list

    def test_npi_inline(self):
        text = "Provider NPI: 1234567890"
        entities = extract_entities(text)
        assert entities.provider_npi == "1234567890"

    def test_multiple_codes(self):
        text = """
        Diagnosis Code: M25.561
        Procedure Code: CPT 73721
        Denial Reason Code: CO-197
        Provider NPI: 9876543210
        """
        entities = extract_entities(text)
        assert "M25.561" in entities.icd10_list
        assert "73721" in entities.cpt_list
        assert "CO-197" in entities.carc_list
        assert entities.provider_npi == "9876543210"