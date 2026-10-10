"""
Biomedical Named Entity Recognition (NER) pipeline.
Two-layer extraction:
  1. Regex patterns — reliable extraction of structured codes
  2. HuggingFace model — optional supplementary extraction
The regex layer is the PRIMARY extraction method for our denial letters
because they contain explicitly labeled codes (e.g., "Diagnosis Code: E11.9").
Architecture:
  extract_entities()           ← public entry point
      ├── _extract_with_regex()    ← pattern-based extraction
      ├── _extract_with_model()    ← HuggingFace NER (optional)
      └── _merge_and_deduplicate() ← combine results, remove duplicates
"""
from __future__ import annotations
import logging
import re
from aegis.models.entities import EntitySpan, ExtractedEntities
logger = logging.getLogger(__name__)
# ═══════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ═══════════════════════════════════════════════════════════════════════════
def extract_entities(text: str, use_model: bool = False) -> ExtractedEntities:
    """
    Extract biomedical and administrative entities from denial letter text.
    Args:
        text:      Full extracted text from a denial letter.
        use_model: If True, also run the HuggingFace NER model.
                   Defaults to False (regex-only mode).
    Returns:
        ExtractedEntities with all found codes, names, and IDs.
    """
    # Layer 1: Regex extraction (always runs)
    regex_spans = _extract_with_regex(text)
    # Layer 2: Model extraction (optional)
    model_spans: list[EntitySpan] = []
    if use_model:
        try:
            model_spans = _extract_with_model(text)
        except Exception as exc:
            logger.warning(f"NER model extraction failed, using regex only: {exc}")
    # Merge and deduplicate
    return _merge_and_deduplicate(regex_spans, model_spans, text)
# ═══════════════════════════════════════════════════════════════════════════
# LAYER 1: REGEX PATTERNS
# ═══════════════════════════════════════════════════════════════════════════
# --- ICD-10 Codes ---
# Format: Letter + 2 digits + optional (dot + 1-4 alphanumeric characters)
# Examples: E11.9, M25.561, F33.1, E11
# Context clues: often preceded by "Diagnosis Code:", "ICD-10:", "ICD:", or "Dx:"
ICD10_PATTERN = re.compile(
    r"""
    (?:                                      # Optional label prefix
        (?:Diagnosis\s*Code|ICD[\s-]*10|Dx)  # Label keywords
        \s*[:\s]\s*                           # Separator (colon or space)
    )?
    \b([A-Z]\d{2}\.?\d{0,4})\b              # The actual ICD-10 code
    """,
    re.VERBOSE | re.IGNORECASE,
)
# Stricter pattern: Only match codes that appear after explicit labels
# This avoids false positives from random alphanumeric strings
ICD10_LABELED_PATTERN = re.compile(
    r"""
    (?:Diagnosis\s*Code|ICD[\s-]*10|Dx)      # Must have a label
    \s*[:\s]\s*                               # Separator
    ([A-TV-Z]\d{2}(?:\.\d{1,4})?)            # ICD-10 code (starts with valid letter range)
    """,
    re.VERBOSE | re.IGNORECASE,
)
# Known ICD-10 codes from our 3 scenarios (for high-confidence matching)
KNOWN_ICD10 = {"E11.9", "M25.561", "F33.1"}
# --- CPT Codes ---
# Format: 5 digits, often preceded by "CPT" or "CPT-"
# Examples: CPT 95251, CPT-73721, 90837
CPT_PATTERN = re.compile(
    r"""
    (?:CPT[\s-]*)                            # "CPT" prefix (required for safety)
    (\d{5})                                  # 5-digit CPT code
    """,
    re.VERBOSE | re.IGNORECASE,
)
# Also match when labeled "Procedure Code:"
CPT_LABELED_PATTERN = re.compile(
    r"""
    (?:Procedure\s*Code)                     # Label
    \s*[:\s]\s*                              # Separator
    (?:CPT[\s-]*)?                           # Optional "CPT" prefix
    (\d{5})                                  # 5-digit code
    """,
    re.VERBOSE | re.IGNORECASE,
)
# --- CARC Denial Codes ---
# Format: CO-xxx, PR-xxx, OA-xxx (Group Code + hyphen + 1-4 digits)
# Examples: CO-167, CO-197, CO-50, PR-1
CARC_PATTERN = re.compile(
    r"""
    \b((?:CO|PR|OA|PI|CR)[\s-]*\d{1,4})\b   # Group code + digits
    """,
    re.VERBOSE,
)
# --- NPI ---
# Format: exactly 10 digits, often preceded by "NPI"
NPI_PATTERN = re.compile(
    r"""
    (?:NPI|Provider\s*NPI)                   # Label
    \s*[:\s]\s*                              # Separator
    (\d{10})                                 # 10-digit NPI
    """,
    re.VERBOSE | re.IGNORECASE,
)
# --- Member ID ---
# Format: varies, but in our synthetic data: ACM-XXXXXXX-XX or similar
MEMBER_ID_PATTERN = re.compile(
    r"""
    (?:Member\s*ID)                          # Label
    \s*[:\s]\s*
    ([A-Z]{2,5}[\s-]\d{5,10}[\s-]\d{1,3})   # Alphanumeric member ID
    """,
    re.VERBOSE | re.IGNORECASE,
)
# --- Claim ID ---
CLAIM_ID_PATTERN = re.compile(
    r"""
    (?:Claim\s*(?:Number|ID|No\.?))          # Label
    \s*[:\s]\s*
    ([A-Z]{2,5}[\s-]\d{4}[\s-]\d{4}[\s-]\d{3})  # Claim number format
    """,
    re.VERBOSE | re.IGNORECASE,
)
# --- Policy ID ---
POLICY_ID_PATTERN = re.compile(
    r"""
    (?:Policy|Policy\s*(?:Number|ID))        # Label
    \s+
    ([A-Z]{2,10}-[A-Z]{2,5}-\d{4}-\d{3})    # Policy ID format: ACME-CGM-2024-001
    """,
    re.VERBOSE | re.IGNORECASE,
)
# --- Payer Name ---
# We'll extract this by looking for the first line of the document (company header)
# and also by looking for common patterns
def _extract_with_regex(text: str) -> list[EntitySpan]:
    """
    Extract entities using regex patterns.
    Returns a flat list of EntitySpan objects.
    """
    spans: list[EntitySpan] = []
    # ── ICD-10 Codes ──
    # Strategy: First try labeled patterns (high confidence), then
    # check for known codes anywhere in text
    for match in ICD10_LABELED_PATTERN.finditer(text):
        code = match.group(1).upper().strip()
        # Normalize: ensure dot is present for sub-codes
        if len(code) > 3 and "." not in code:
            code = code[:3] + "." + code[3:]
        spans.append(EntitySpan(
            text=match.group(0).strip(),
            normalized=code,
            category="icd10",
            source="regex",
            start_char=match.start(),
            end_char=match.end(),
        ))
    # Also scan for known ICD-10 codes anywhere in text (catch unlabeled mentions)
    found_icd = {s.normalized for s in spans if s.category == "icd10"}
    for known_code in KNOWN_ICD10:
        if known_code not in found_icd and known_code in text.upper():
            idx = text.upper().find(known_code)
            spans.append(EntitySpan(
                text=known_code,
                normalized=known_code,
                category="icd10",
                source="regex",
                start_char=idx,
                end_char=idx + len(known_code),
            ))
    # ── CPT Codes ──
    for pattern in [CPT_LABELED_PATTERN, CPT_PATTERN]:
        for match in pattern.finditer(text):
            code = match.group(1).strip()
            if code not in {s.normalized for s in spans if s.category == "cpt"}:
                spans.append(EntitySpan(
                    text=match.group(0).strip(),
                    normalized=code,
                    category="cpt",
                    source="regex",
                    start_char=match.start(),
                    end_char=match.end(),
                ))
    # ── CARC Denial Codes ──
    for match in CARC_PATTERN.finditer(text):
        raw = match.group(1).strip()
        # Normalize: remove spaces, ensure hyphen format → "CO-167"
        normalized = re.sub(r"\s+", "", raw)
        if "-" not in normalized:
            # Insert hyphen between letters and digits: "CO167" → "CO-167"
            normalized = re.sub(r"([A-Z]+)(\d+)", r"\1-\2", normalized)
        if normalized not in {s.normalized for s in spans if s.category == "carc"}:
            spans.append(EntitySpan(
                text=raw,
                normalized=normalized,
                category="carc",
                source="regex",
                start_char=match.start(),
                end_char=match.end(),
            ))
    # ── NPI ──
    match = NPI_PATTERN.search(text)
    if match:
        spans.append(EntitySpan(
            text=match.group(0).strip(),
            normalized=match.group(1),
            category="npi",
            source="regex",
            start_char=match.start(),
            end_char=match.end(),
        ))
    # ── Member ID ──
    match = MEMBER_ID_PATTERN.search(text)
    if match:
        spans.append(EntitySpan(
            text=match.group(0).strip(),
            normalized=match.group(1).strip(),
            category="member_id",
            source="regex",
            start_char=match.start(),
            end_char=match.end(),
        ))
    # ── Claim ID ──
    match = CLAIM_ID_PATTERN.search(text)
    if match:
        spans.append(EntitySpan(
            text=match.group(0).strip(),
            normalized=match.group(1).strip(),
            category="claim_id",
            source="regex",
            start_char=match.start(),
            end_char=match.end(),
        ))
    # ── Policy ID ──
    match = POLICY_ID_PATTERN.search(text)
    if match:
        spans.append(EntitySpan(
            text=match.group(0).strip(),
            normalized=match.group(1).strip(),
            category="policy_id",
            source="regex",
            start_char=match.start(),
            end_char=match.end(),
        ))
    # ── Payer Name ──
    # Strategy: first non-empty line of the document is typically the company name
    first_line = text.strip().split("\n")[0].strip()
    if first_line and len(first_line) < 100:  # Sanity check
        spans.append(EntitySpan(
            text=first_line,
            normalized=first_line,
            category="payer",
            source="regex",
            start_char=0,
            end_char=len(first_line),
        ))
    return spans
    # ═══════════════════════════════════════════════════════════════════════════
# MERGE & DEDUPLICATE
# ═══════════════════════════════════════════════════════════════════════════
def _merge_and_deduplicate(
    regex_spans: list[EntitySpan],
    model_spans: list[EntitySpan],
    text: str,
) -> ExtractedEntities:
    """
    Merge regex and model spans, deduplicate by normalized value + category.
    If the same code appears in both sources, mark source as "both".
    """
    # Build lookup: (category, normalized) → EntitySpan
    merged: dict[tuple[str, str], EntitySpan] = {}
    for span in regex_spans:
        key = (span.category, span.normalized)
        merged[key] = span
    for span in model_spans:
        key = (span.category, span.normalized)
        if key in merged:
            # Already found by regex — mark as "both"
            merged[key].source = "both"
        else:
            merged[key] = span
    # Build the final ExtractedEntities
    result = ExtractedEntities()
    for (category, _normalized), span in merged.items():
        if category == "icd10":
            result.icd10_codes.append(span)
        elif category == "cpt":
            result.cpt_codes.append(span)
        elif category == "carc":
            result.denial_codes.append(span)
        elif category == "payer":
            result.payer_name = span.normalized
        elif category == "npi":
            result.provider_npi = span.normalized
        elif category == "member_id":
            result.member_id = span.normalized
        elif category == "claim_id":
            result.claim_id = span.normalized
        elif category == "policy_id":
            result.policy_id = span.normalized
    return result