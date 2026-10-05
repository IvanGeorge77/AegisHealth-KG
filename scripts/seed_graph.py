"""
Seed the AegisHealth Knowledge Graph with data from all 3 scenarios.

Usage:
    python scripts/seed_graph.py

This script:
    1. Connects to Neo4j
    2. Clears any existing data
    3. Creates constraints and indexes
    4. Creates all nodes (Payer, Diagnoses, Procedures, PolicyRules, Requirements, Patients, Statutes)
    5. Creates all relationships
    6. Prints a summary

Prerequisites:
    - Neo4j must be running (docker compose up neo4j -d)
    - .env file must have correct Neo4j credentials
"""

from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path

# Add the src directory to the path so we can import aegis modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from aegis.graph.client import Neo4jClient  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# NODE DATA
# ═══════════════════════════════════════════════════════════════════════════

PAYER = {
    "payer_id": "ACMECARE",
    "name": "AcmeCare Health Insurance",
}

DIAGNOSES = [
    {
        "code": "E11.9",
        "description": "Type 2 Diabetes Mellitus without complications",
        "category": "E11",
        "chapter": "4",
    },
    {
        "code": "E11.65",
        "description": "Type 2 Diabetes Mellitus with hyperglycemia",
        "category": "E11",
        "chapter": "4",
    },
    {
        "code": "M25.561",
        "description": "Pain in right knee",
        "category": "M25",
        "chapter": "13",
    },
    {
        "code": "F33.1",
        "description": "Major Depressive Disorder, recurrent episode, moderate",
        "category": "F33",
        "chapter": "5",
    },
]

PROCEDURES = [
    {
        "code": "95251",
        "code_type": "CPT",
        "description": "Continuous Glucose Monitoring — interpretation and report",
        "category": "Medicine",
        "requires_prior_auth": True,
    },
    {
        "code": "73721",
        "code_type": "CPT",
        "description": "MRI, lower extremity joint, without contrast",
        "category": "Radiology",
        "requires_prior_auth": True,
    },
    {
        "code": "90837",
        "code_type": "CPT",
        "description": "Psychotherapy, 53 minutes or more",
        "category": "Medicine",
        "requires_prior_auth": False,  # only after session 20
    },
]

POLICY_RULES = [
    {
        "policy_id": "ACME-CGM-2024-001",
        "payer_name": "AcmeCare Health Insurance",
        "description": "CGM coverage requiring step therapy: Metformin trial, sulfonylurea trial, and clinical documentation of glycemic instability",
        "denial_category": "STEP_THERAPY_NOT_SATISFIED",
        "carc_code": "CO-167",
        "effective_date": "2024-01-01",
    },
    {
        "policy_id": "ACME-MRI-2024-002",
        "payer_name": "AcmeCare Health Insurance",
        "description": "Lower extremity MRI coverage requiring prior authorization, 6 weeks of conservative physical therapy, and clinical examination within 30 days",
        "denial_category": "PRIOR_AUTH_MISSING",
        "carc_code": "CO-197",
        "effective_date": "2024-01-01",
    },
    {
        "policy_id": "ACME-MH-2024-003",
        "payer_name": "AcmeCare Health Insurance",
        "description": "Outpatient psychotherapy coverage: sessions 1-20 auto-authorized, sessions 21+ require medical necessity justification with PHQ-9 >= 10, treatment plan, progress notes, and clinical rationale",
        "denial_category": "MEDICAL_NECESSITY_NOT_ESTABLISHED",
        "carc_code": "CO-50",
        "effective_date": "2024-01-01",
    },
]

REQUIREMENTS = [
    # ── Scenario 1: Step Therapy ──
    {
        "requirement_id": "REQ-STEP-METFORMIN",
        "description": "Trial of Metformin for minimum 90 days with documented failure or contraindication",
        "requirement_type": "STEP_THERAPY",
        "evidence_required": "Prescription records showing Metformin dispensation AND clinical notes documenting inadequate glycemic control (HbA1c > 7.0%) despite compliance, OR documented adverse reaction/contraindication",
        "order": 1,
        "policy_id": "ACME-CGM-2024-001",
    },
    {
        "requirement_id": "REQ-STEP-SULFONYLUREA",
        "description": "Trial of sulfonylurea for minimum 90 days with documented failure or contraindication",
        "requirement_type": "STEP_THERAPY",
        "evidence_required": "Prescription records showing sulfonylurea dispensation AND clinical notes documenting inadequate glycemic control despite compliance with both Metformin and the sulfonylurea, OR documented adverse reaction/contraindication",
        "order": 2,
        "policy_id": "ACME-CGM-2024-001",
    },
    {
        "requirement_id": "REQ-HYPO-LOG",
        "description": "3-month log of blood glucose readings showing recurrent hypoglycemic events or sustained HbA1c > 8.0%",
        "requirement_type": "CLINICAL_DOCUMENTATION",
        "evidence_required": "Minimum 3-month log of blood glucose readings showing at least 3 documented hypoglycemic events (blood glucose < 70 mg/dL) OR sustained HbA1c > 8.0% on most recent lab work",
        "order": 3,
        "policy_id": "ACME-CGM-2024-001",
    },
    # ── Scenario 2: Prior Authorization ──
    {
        "requirement_id": "REQ-PRIOR-AUTH",
        "description": "Prior Authorization Form PA-200 submitted at least 5 business days before imaging",
        "requirement_type": "PRIOR_AUTHORIZATION",
        "evidence_required": "Completed Prior Authorization Request Form (AcmeCare Form PA-200) submitted at least 5 business days before the scheduled imaging date",
        "order": 0,
        "policy_id": "ACME-MRI-2024-002",
    },
    {
        "requirement_id": "REQ-PHYSIO-6WK",
        "description": "6 weeks of documented conservative physical therapy with minimum 6 sessions",
        "requirement_type": "CLINICAL_DOCUMENTATION",
        "evidence_required": "Physical therapy treatment notes showing date of initial PT evaluation, minimum of 6 PT sessions over 6 weeks, description of exercises/modalities, assessment of progress, and therapist recommendation",
        "order": 0,
        "policy_id": "ACME-MRI-2024-002",
    },
    {
        "requirement_id": "REQ-CLINICAL-EXAM",
        "description": "Physical examination of affected joint within 30 days of MRI request",
        "requirement_type": "CLINICAL_DOCUMENTATION",
        "evidence_required": "Office visit note documenting range of motion assessment, joint stability testing, pain assessment with validated scale, and clinical impression with rationale for imaging",
        "order": 0,
        "policy_id": "ACME-MRI-2024-002",
    },
    # ── Scenario 3: Medical Necessity ──
    {
        "requirement_id": "REQ-MH-BASELINE",
        "description": "Active behavioral health diagnosis on file with in-network licensed provider",
        "requirement_type": "CLINICAL_DOCUMENTATION",
        "evidence_required": "Active behavioral health diagnosis on file, treating provider is in-network licensed mental health professional, sessions documented with standard progress notes",
        "order": 0,
        "policy_id": "ACME-MH-2024-003",
    },
    {
        "requirement_id": "REQ-MH-MEDICAL-NECESSITY",
        "description": "For session 21+: PHQ-9 >= 10, treatment plan with measurable goals, progress documentation, clinical rationale for continuation",
        "requirement_type": "MEDICAL_NECESSITY",
        "evidence_required": "Validated symptom severity assessment (PHQ-9 score >= 10), treatment plan with measurable goals, documentation of treatment progress, clinical rationale explaining why discontinuation would be clinically inappropriate",
        "order": 0,
        "policy_id": "ACME-MH-2024-003",
    },
]

PATIENTS = [
    {
        "patient_id": "SYN-PAT-001",
        "first_name": "Maria",
        "last_name": "Gonzalez",
        "member_id": "ACM-8827451-01",
        "claim_id": "CLM-2024-0815-001",
        "scenario": 1,
    },
    {
        "patient_id": "SYN-PAT-002",
        "first_name": "James",
        "last_name": "Chen",
        "member_id": "ACM-3314982-02",
        "claim_id": "CLM-2024-0712-002",
        "scenario": 2,
    },
    {
        "patient_id": "SYN-PAT-003",
        "first_name": "Aisha",
        "last_name": "Williams",
        "member_id": "ACM-5567123-03",
        "claim_id": "CLM-2024-0910-003",
        "scenario": 3,
    },
]

STATUTES = [
    # Scenario 1
    {
        "citation": "State Insurance Code §4521.3 — Step Therapy Protocol Override Rights",
        "short_name": "§4521.3",
        "description": "Provides patients the right to override step therapy requirements under certain conditions",
    },
    {
        "citation": "42 CFR §423.578 — Medicare Part D Coverage Determination",
        "short_name": "42 CFR §423.578",
        "description": "Federal regulation governing Medicare Part D coverage determination and appeals process",
    },
    # Scenario 2
    {
        "citation": "State Insurance Code §3891.1 — Timely Prior Authorization Review Requirements",
        "short_name": "§3891.1",
        "description": "Requires insurers to process prior authorization requests within specified timeframes",
    },
    {
        "citation": "42 CFR §438.210 — Prior Authorization of Services",
        "short_name": "42 CFR §438.210",
        "description": "Federal regulation governing prior authorization requirements for Medicaid managed care",
    },
    # Scenario 3
    {
        "citation": "Mental Health Parity and Addiction Equity Act (MHPAEA), 29 USC §1185a",
        "short_name": "MHPAEA 29 USC §1185a",
        "description": "Requires parity between mental health/substance use disorder benefits and medical/surgical benefits",
    },
    {
        "citation": "42 CFR §438.910 — Parity Requirements for Medicaid Managed Care",
        "short_name": "42 CFR §438.910",
        "description": "Federal regulation extending mental health parity requirements to Medicaid managed care plans",
    },
    {
        "citation": "State Insurance Code §6200.7 — Mental Health Coverage Parity Provisions",
        "short_name": "§6200.7",
        "description": "State-level mental health parity law ensuring equal coverage for behavioral health services",
    },
]


# ═══════════════════════════════════════════════════════════════════════════
# RELATIONSHIP DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════

# Each tuple: (from_label, from_key_field, from_key_value, rel_type, to_label, to_key_field, to_key_value)
RELATIONSHIPS = [
    # ── INDICATED_FOR: Diagnosis → Procedure ──
    ("Diagnosis", "code", "E11.9",    "INDICATED_FOR", "Procedure", "code", "95251"),
    ("Diagnosis", "code", "E11.65",   "INDICATED_FOR", "Procedure", "code", "95251"),
    ("Diagnosis", "code", "M25.561",  "INDICATED_FOR", "Procedure", "code", "73721"),
    ("Diagnosis", "code", "F33.1",    "INDICATED_FOR", "Procedure", "code", "90837"),

    # ── COVERED_BY: Procedure → PolicyRule ──
    ("Procedure", "code", "95251",  "COVERED_BY", "PolicyRule", "policy_id", "ACME-CGM-2024-001"),
    ("Procedure", "code", "73721",  "COVERED_BY", "PolicyRule", "policy_id", "ACME-MRI-2024-002"),
    ("Procedure", "code", "90837",  "COVERED_BY", "PolicyRule", "policy_id", "ACME-MH-2024-003"),

    # ── REQUIRES: PolicyRule → Requirement ──
    ("PolicyRule", "policy_id", "ACME-CGM-2024-001", "REQUIRES", "Requirement", "requirement_id", "REQ-STEP-METFORMIN"),
    ("PolicyRule", "policy_id", "ACME-CGM-2024-001", "REQUIRES", "Requirement", "requirement_id", "REQ-STEP-SULFONYLUREA"),
    ("PolicyRule", "policy_id", "ACME-CGM-2024-001", "REQUIRES", "Requirement", "requirement_id", "REQ-HYPO-LOG"),
    ("PolicyRule", "policy_id", "ACME-MRI-2024-002", "REQUIRES", "Requirement", "requirement_id", "REQ-PRIOR-AUTH"),
    ("PolicyRule", "policy_id", "ACME-MRI-2024-002", "REQUIRES", "Requirement", "requirement_id", "REQ-PHYSIO-6WK"),
    ("PolicyRule", "policy_id", "ACME-MRI-2024-002", "REQUIRES", "Requirement", "requirement_id", "REQ-CLINICAL-EXAM"),
    ("PolicyRule", "policy_id", "ACME-MH-2024-003",  "REQUIRES", "Requirement", "requirement_id", "REQ-MH-BASELINE"),
    ("PolicyRule", "policy_id", "ACME-MH-2024-003",  "REQUIRES", "Requirement", "requirement_id", "REQ-MH-MEDICAL-NECESSITY"),

    # ── PRECEDES: Requirement → Requirement (step therapy ordering) ──
    ("Requirement", "requirement_id", "REQ-STEP-METFORMIN", "PRECEDES", "Requirement", "requirement_id", "REQ-STEP-SULFONYLUREA"),

    # ── HAS_CLAIM_FOR: Patient → Procedure ──
    ("Patient", "patient_id", "SYN-PAT-001", "HAS_CLAIM_FOR", "Procedure", "code", "95251"),
    ("Patient", "patient_id", "SYN-PAT-002", "HAS_CLAIM_FOR", "Procedure", "code", "73721"),
    ("Patient", "patient_id", "SYN-PAT-003", "HAS_CLAIM_FOR", "Procedure", "code", "90837"),

    # ── ISSUED: Payer → PolicyRule ──
    ("Payer", "payer_id", "ACMECARE", "ISSUED", "PolicyRule", "policy_id", "ACME-CGM-2024-001"),
    ("Payer", "payer_id", "ACMECARE", "ISSUED", "PolicyRule", "policy_id", "ACME-MRI-2024-002"),
    ("Payer", "payer_id", "ACMECARE", "ISSUED", "PolicyRule", "policy_id", "ACME-MH-2024-003"),

    # ── REFERENCES_STATUTE: PolicyRule → Statute ──
    ("PolicyRule", "policy_id", "ACME-CGM-2024-001", "REFERENCES_STATUTE", "Statute", "citation", "State Insurance Code §4521.3 — Step Therapy Protocol Override Rights"),
    ("PolicyRule", "policy_id", "ACME-CGM-2024-001", "REFERENCES_STATUTE", "Statute", "citation", "42 CFR §423.578 — Medicare Part D Coverage Determination"),
    ("PolicyRule", "policy_id", "ACME-MRI-2024-002", "REFERENCES_STATUTE", "Statute", "citation", "State Insurance Code §3891.1 — Timely Prior Authorization Review Requirements"),
    ("PolicyRule", "policy_id", "ACME-MRI-2024-002", "REFERENCES_STATUTE", "Statute", "citation", "42 CFR §438.210 — Prior Authorization of Services"),
    ("PolicyRule", "policy_id", "ACME-MH-2024-003",  "REFERENCES_STATUTE", "Statute", "citation", "Mental Health Parity and Addiction Equity Act (MHPAEA), 29 USC §1185a"),
    ("PolicyRule", "policy_id", "ACME-MH-2024-003",  "REFERENCES_STATUTE", "Statute", "citation", "42 CFR §438.910 — Parity Requirements for Medicaid Managed Care"),
    ("PolicyRule", "policy_id", "ACME-MH-2024-003",  "REFERENCES_STATUTE", "Statute", "citation", "State Insurance Code §6200.7 — Mental Health Coverage Parity Provisions"),
]


# ═══════════════════════════════════════════════════════════════════════════
# SEED FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

async def create_node(client: Neo4jClient, label: str, key_field: str, props: dict) -> None:
    """MERGE a single node (create if not exists, update if exists)."""
    # Build SET clause for all properties except the key
    set_parts = []
    params = {key_field: props[key_field]}

    for k, v in props.items():
        if k != key_field:
            set_parts.append(f"n.{k} = ${k}")
            params[k] = v

    set_clause = ", ".join(set_parts)
    query = f"MERGE (n:{label} {{{key_field}: ${key_field}}})"
    if set_clause:
        query += f" SET {set_clause}"

    await client.run_write(query, params)


async def create_relationship(
    client: Neo4jClient,
    from_label: str, from_key: str, from_val: str,
    rel_type: str,
    to_label: str, to_key: str, to_val: str,
) -> None:
    """MERGE a relationship between two existing nodes."""
    query = (
        f"MATCH (a:{from_label} {{{from_key}: $from_val}}) "
        f"MATCH (b:{to_label} {{{to_key}: $to_val}}) "
        f"MERGE (a)-[r:{rel_type}]->(b)"
    )
    await client.run_write(query, {"from_val": from_val, "to_val": to_val})


async def seed() -> None:
    """Main seed function — runs the complete seeding process."""
    client = Neo4jClient()
    await client.connect()

    try:
        # Step 1: Clear existing data
        logger.info("=" * 60)
        logger.info("Step 1: Clearing existing data...")
        await client.clear_database()

        # Step 2: Create constraints and indexes
        logger.info("=" * 60)
        logger.info("Step 2: Creating constraints and indexes...")
        await client.create_constraints()

        # Step 3: Create nodes
        logger.info("=" * 60)
        logger.info("Step 3: Creating nodes...")

        # Payer
        await create_node(client, "Payer", "payer_id", PAYER)
        logger.info("  ✅ Payer: %s", PAYER["name"])

        # Diagnoses
        for d in DIAGNOSES:
            await create_node(client, "Diagnosis", "code", d)
            logger.info("  ✅ Diagnosis: %s — %s", d["code"], d["description"])

        # Procedures
        for p in PROCEDURES:
            await create_node(client, "Procedure", "code", p)
            logger.info("  ✅ Procedure: CPT-%s — %s", p["code"], p["description"])

        # PolicyRules
        for pol in POLICY_RULES:
            await create_node(client, "PolicyRule", "policy_id", pol)
            logger.info("  ✅ PolicyRule: %s", pol["policy_id"])

        # Requirements
        for req in REQUIREMENTS:
            # Remove policy_id from props (it's used for relationships, not stored on the node)
            node_props = {k: v for k, v in req.items() if k != "policy_id"}
            await create_node(client, "Requirement", "requirement_id", node_props)
            logger.info("  ✅ Requirement: %s", req["requirement_id"])

        # Patients
        for pat in PATIENTS:
            await create_node(client, "Patient", "patient_id", pat)
            logger.info("  ✅ Patient: %s %s (%s)", pat["first_name"], pat["last_name"], pat["patient_id"])

        # Statutes
        for stat in STATUTES:
            await create_node(client, "Statute", "citation", stat)
            logger.info("  ✅ Statute: %s", stat["short_name"])

        # Step 4: Create relationships
        logger.info("=" * 60)
        logger.info("Step 4: Creating relationships...")

        for rel in RELATIONSHIPS:
            from_label, from_key, from_val, rel_type, to_label, to_key, to_val = rel
            await create_relationship(
                client, from_label, from_key, from_val, rel_type, to_label, to_key, to_val
            )
            logger.info("  ✅ (%s:%s)-[%s]->(%s:%s)", from_label, from_val, rel_type, to_label, to_val)

        # Step 5: Print summary
        logger.info("=" * 60)
        logger.info("SEED COMPLETE!")
        node_count = await client.node_count()
        rel_count = await client.relationship_count()
        logger.info("  Total nodes: %d", node_count)
        logger.info("  Total relationships: %d", rel_count)
        logger.info("")
        logger.info("Open Neo4j Browser at http://localhost:7474")
        logger.info("Run: MATCH (n) RETURN n")
        logger.info("=" * 60)

    finally:
        await client.close()


# ═══════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    asyncio.run(seed())