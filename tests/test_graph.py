"""
Tests for the Knowledge Graph schema, seed data, and Neo4j client.

Prerequisites:
    - Neo4j must be running (docker compose up neo4j -d)
    - Seed script must have been run (python scripts/seed_graph.py)

Run:
    pytest tests/test_graph.py -v
"""

import pytest
import asyncio
from aegis.graph.client import Neo4jClient


@pytest.fixture(scope="module")
def event_loop():
    """Create an event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="module")
def client(event_loop):
    """Create and connect a Neo4jClient for the test module."""
    c = Neo4jClient()
    event_loop.run_until_complete(c.connect())
    yield c
    event_loop.run_until_complete(c.close())


def run(coro, loop):
    """Helper to run async code in sync tests."""
    return loop.run_until_complete(coro)


# ── Node Count Tests ─────────────────────────────────────────────────────

class TestNodeCounts:
    """Verify the expected number of each node type exists."""

    def test_total_node_count(self, client, event_loop):
        """Total nodes: 1 Payer + 4 Diagnoses + 3 Procedures + 3 Policies + 8 Requirements + 3 Patients + 7 Statutes = 29."""
        count = run(client.node_count(), event_loop)
        assert count == 29, f"Expected 29 total nodes, got {count}"

    def test_diagnosis_count(self, client, event_loop):
        records = run(client.run_query("MATCH (n:Diagnosis) RETURN count(n) AS c"), event_loop)
        assert records[0]["c"] == 4

    def test_procedure_count(self, client, event_loop):
        records = run(client.run_query("MATCH (n:Procedure) RETURN count(n) AS c"), event_loop)
        assert records[0]["c"] == 3

    def test_policy_count(self, client, event_loop):
        records = run(client.run_query("MATCH (n:PolicyRule) RETURN count(n) AS c"), event_loop)
        assert records[0]["c"] == 3

    def test_requirement_count(self, client, event_loop):
        records = run(client.run_query("MATCH (n:Requirement) RETURN count(n) AS c"), event_loop)
        assert records[0]["c"] == 8

    def test_patient_count(self, client, event_loop):
        records = run(client.run_query("MATCH (n:Patient) RETURN count(n) AS c"), event_loop)
        assert records[0]["c"] == 3

    def test_payer_count(self, client, event_loop):
        records = run(client.run_query("MATCH (n:Payer) RETURN count(n) AS c"), event_loop)
        assert records[0]["c"] == 1

    def test_statute_count(self, client, event_loop):
        records = run(client.run_query("MATCH (n:Statute) RETURN count(n) AS c"), event_loop)
        assert records[0]["c"] == 7


# ── Relationship Tests ───────────────────────────────────────────────────

class TestRelationships:
    """Verify all expected relationships exist."""

    def test_total_relationship_count(self, client, event_loop):
        count = run(client.relationship_count(), event_loop)
        assert count == 27, f"Expected 27 relationships, got {count}"

    def test_indicated_for_edges(self, client, event_loop):
        records = run(client.run_query(
            "MATCH (:Diagnosis)-[r:INDICATED_FOR]->(:Procedure) RETURN count(r) AS c"
        ), event_loop)
        assert records[0]["c"] == 4

    def test_covered_by_edges(self, client, event_loop):
        records = run(client.run_query(
            "MATCH (:Procedure)-[r:COVERED_BY]->(:PolicyRule) RETURN count(r) AS c"
        ), event_loop)
        assert records[0]["c"] == 3

    def test_requires_edges(self, client, event_loop):
        records = run(client.run_query(
            "MATCH (:PolicyRule)-[r:REQUIRES]->(:Requirement) RETURN count(r) AS c"
        ), event_loop)
        assert records[0]["c"] == 8

    def test_precedes_edge(self, client, event_loop):
        records = run(client.run_query(
            "MATCH (r1:Requirement)-[:PRECEDES]->(r2:Requirement) "
            "RETURN r1.requirement_id AS from_id, r2.requirement_id AS to_id"
        ), event_loop)
        assert len(records) == 1
        assert records[0]["from_id"] == "REQ-STEP-METFORMIN"
        assert records[0]["to_id"] == "REQ-STEP-SULFONYLUREA"


# ── Scenario Path Tests ──────────────────────────────────────────────────

class TestScenarioPaths:
    """Verify end-to-end graph paths for each scenario."""

    def test_scenario_1_full_path(self, client, event_loop):
        """Scenario 1: E11.9 → 95251 → ACME-CGM-2024-001 → 3 requirements."""
        records = run(client.run_query(
            "MATCH (d:Diagnosis {code: 'E11.9'})-[:INDICATED_FOR]->(p:Procedure {code: '95251'})"
            "-[:COVERED_BY]->(pol:PolicyRule {policy_id: 'ACME-CGM-2024-001'})"
            "-[:REQUIRES]->(r:Requirement) "
            "RETURN r.requirement_id AS req_id ORDER BY r.order"
        ), event_loop)
        req_ids = [r["req_id"] for r in records]
        assert len(req_ids) == 3
        assert "REQ-STEP-METFORMIN" in req_ids
        assert "REQ-STEP-SULFONYLUREA" in req_ids
        assert "REQ-HYPO-LOG" in req_ids

    def test_scenario_2_full_path(self, client, event_loop):
        """Scenario 2: M25.561 → 73721 → ACME-MRI-2024-002 → 3 requirements."""
        records = run(client.run_query(
            "MATCH (d:Diagnosis {code: 'M25.561'})-[:INDICATED_FOR]->(p:Procedure {code: '73721'})"
            "-[:COVERED_BY]->(pol:PolicyRule {policy_id: 'ACME-MRI-2024-002'})"
            "-[:REQUIRES]->(r:Requirement) "
            "RETURN r.requirement_id AS req_id"
        ), event_loop)
        req_ids = [r["req_id"] for r in records]
        assert len(req_ids) == 3
        assert "REQ-PRIOR-AUTH" in req_ids
        assert "REQ-PHYSIO-6WK" in req_ids
        assert "REQ-CLINICAL-EXAM" in req_ids

    def test_scenario_3_full_path(self, client, event_loop):
        """Scenario 3: F33.1 → 90837 → ACME-MH-2024-003 → 2 requirements."""
        records = run(client.run_query(
            "MATCH (d:Diagnosis {code: 'F33.1'})-[:INDICATED_FOR]->(p:Procedure {code: '90837'})"
            "-[:COVERED_BY]->(pol:PolicyRule {policy_id: 'ACME-MH-2024-003'})"
            "-[:REQUIRES]->(r:Requirement) "
            "RETURN r.requirement_id AS req_id"
        ), event_loop)
        req_ids = [r["req_id"] for r in records]
        assert len(req_ids) == 2
        assert "REQ-MH-BASELINE" in req_ids
        assert "REQ-MH-MEDICAL-NECESSITY" in req_ids

    def test_scenario_1_patient_path(self, client, event_loop):
        """Patient SYN-PAT-001 has a claim for CPT 95251."""
        records = run(client.run_query(
            "MATCH (pat:Patient {patient_id: 'SYN-PAT-001'})-[:HAS_CLAIM_FOR]->(p:Procedure) "
            "RETURN p.code AS cpt"
        ), event_loop)
        assert records[0]["cpt"] == "95251"

    def test_scenario_1_legal_references(self, client, event_loop):
        """Policy ACME-CGM-2024-001 references 2 statutes."""
        records = run(client.run_query(
            "MATCH (pol:PolicyRule {policy_id: 'ACME-CGM-2024-001'})-[:REFERENCES_STATUTE]->(s:Statute) "
            "RETURN s.short_name AS name ORDER BY name"
        ), event_loop)
        assert len(records) == 2
        names = [r["name"] for r in records]
        assert "42 CFR §423.578" in names
        assert "§4521.3" in names

    def test_scenario_3_mhpaea_reference(self, client, event_loop):
        """Policy ACME-MH-2024-003 references MHPAEA."""
        records = run(client.run_query(
            "MATCH (pol:PolicyRule {policy_id: 'ACME-MH-2024-003'})-[:REFERENCES_STATUTE]->(s:Statute) "
            "WHERE s.short_name CONTAINS 'MHPAEA' "
            "RETURN s.citation AS citation"
        ), event_loop)
        assert len(records) == 1
        assert "29 USC §1185a" in records[0]["citation"]


# ── Denial Category Tests ────────────────────────────────────────────────

class TestDenialCategories:
    """Verify denial categories match the answer keys."""

    def test_scenario_1_denial_category(self, client, event_loop):
        records = run(client.run_query(
            "MATCH (pol:PolicyRule {policy_id: 'ACME-CGM-2024-001'}) "
            "RETURN pol.denial_category AS cat, pol.carc_code AS carc"
        ), event_loop)
        assert records[0]["cat"] == "STEP_THERAPY_NOT_SATISFIED"
        assert records[0]["carc"] == "CO-167"

    def test_scenario_2_denial_category(self, client, event_loop):
        records = run(client.run_query(
            "MATCH (pol:PolicyRule {policy_id: 'ACME-MRI-2024-002'}) "
            "RETURN pol.denial_category AS cat, pol.carc_code AS carc"
        ), event_loop)
        assert records[0]["cat"] == "PRIOR_AUTH_MISSING"
        assert records[0]["carc"] == "CO-197"

    def test_scenario_3_denial_category(self, client, event_loop):
        records = run(client.run_query(
            "MATCH (pol:PolicyRule {policy_id: 'ACME-MH-2024-003'}) "
            "RETURN pol.denial_category AS cat, pol.carc_code AS carc"
        ), event_loop)
        assert records[0]["cat"] == "MEDICAL_NECESSITY_NOT_ESTABLISHED"
        assert records[0]["carc"] == "CO-50"