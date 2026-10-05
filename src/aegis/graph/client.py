"""
Thin wrapper around the official Neo4j Python driver.

Usage:
    from aegis.graph.client import Neo4jClient

    client = Neo4jClient()          # reads URI/user/password from settings
    await client.connect()          # open the driver

    records = await client.run_query("MATCH (n) RETURN n LIMIT 5")
    print(records)

    await client.close()            # clean up
"""

from __future__ import annotations

import logging
from typing import Any

from neo4j import AsyncGraphDatabase, AsyncDriver

from aegis.config.settings import get_settings

logger = logging.getLogger(__name__)


class Neo4jClient:
    """Async Neo4j driver wrapper for AegisHealth-KG."""

    def __init__(
        self,
        uri: str | None = None,
        user: str | None = None,
        password: str | None = None,
    ) -> None:
        settings = get_settings()
        self._uri = uri or settings.neo4j_uri
        self._user = user or settings.neo4j_user
        self._password = password or settings.neo4j_password
        self._driver: AsyncDriver | None = None

    # ── lifecycle ─────────────────────────────────────────────────────

    async def connect(self) -> None:
        """Open the Neo4j driver connection."""
        if self._driver is not None:
            return
        logger.info("Connecting to Neo4j at %s", self._uri)
        self._driver = AsyncGraphDatabase.driver(
            self._uri,
            auth=(self._user, self._password),
        )
        # Verify connectivity
        await self._driver.verify_connectivity()
        logger.info("✅ Connected to Neo4j")

    async def close(self) -> None:
        """Close the Neo4j driver connection."""
        if self._driver is not None:
            await self._driver.close()
            self._driver = None
            logger.info("Neo4j connection closed")

    # ── query helpers ─────────────────────────────────────────────────

    async def run_query(
        self,
        query: str,
        parameters: dict[str, Any] | None = None,
        database: str = "neo4j",
    ) -> list[dict[str, Any]]:
        """
        Execute a Cypher query and return results as a list of dicts.

        Args:
            query: Cypher query string
            parameters: Optional query parameters (always use parameters, never string interpolation!)
            database: Neo4j database name

        Returns:
            List of record dictionaries
        """
        if self._driver is None:
            raise RuntimeError("Neo4jClient not connected. Call connect() first.")

        async with self._driver.session(database=database) as session:
            result = await session.run(query, parameters or {})
            records = [record.data() async for record in result]
            return records

    async def run_write(
        self,
        query: str,
        parameters: dict[str, Any] | None = None,
        database: str = "neo4j",
    ) -> list[dict[str, Any]]:
        """
        Execute a write transaction (CREATE, MERGE, DELETE, etc.).

        Uses an explicit write transaction for safety.
        """
        if self._driver is None:
            raise RuntimeError("Neo4jClient not connected. Call connect() first.")

        async with self._driver.session(database=database) as session:
            result = await session.execute_write(
                self._write_tx, query, parameters or {}
            )
            return result

    @staticmethod
    async def _write_tx(tx, query: str, parameters: dict) -> list[dict[str, Any]]:
        """Transaction function for write operations."""
        result = await tx.run(query, parameters)
        records = [record.data() async for record in result]
        return records

    async def clear_database(self, database: str = "neo4j") -> None:
        """
        Delete ALL nodes and relationships. USE WITH CAUTION.

        Only intended for development/testing — never in production.
        """
        logger.warning("⚠️  Clearing all data from Neo4j database '%s'", database)
        await self.run_write("MATCH (n) DETACH DELETE n", database=database)
        logger.info("Database cleared")

    async def create_constraints(self, database: str = "neo4j") -> None:
        """
        Create uniqueness constraints and indexes for the AegisHealth schema.

        Constraints:
            - Diagnosis.code must be unique
            - Procedure.code must be unique
            - PolicyRule.policy_id must be unique
            - Requirement.requirement_id must be unique
            - Patient.patient_id must be unique
            - Payer.payer_id must be unique
            - Statute.citation must be unique

        Indexes:
            - Full-text index on PolicyRule.description for text search
        """
        constraints = [
            ("constraint_diagnosis_code",    "Diagnosis",   "code"),
            ("constraint_procedure_code",    "Procedure",   "code"),
            ("constraint_policy_id",         "PolicyRule",  "policy_id"),
            ("constraint_requirement_id",    "Requirement", "requirement_id"),
            ("constraint_patient_id",        "Patient",     "patient_id"),
            ("constraint_payer_id",          "Payer",       "payer_id"),
            ("constraint_statute_citation",  "Statute",     "citation"),
        ]

        for name, label, prop in constraints:
            query = (
                f"CREATE CONSTRAINT {name} IF NOT EXISTS "
                f"FOR (n:{label}) REQUIRE n.{prop} IS UNIQUE"
            )
            await self.run_write(query, database=database)
            logger.info("  ✅ Constraint: %s.%s", label, prop)

        # Full-text index on PolicyRule.description
        try:
            await self.run_write(
                "CREATE FULLTEXT INDEX policy_description_index IF NOT EXISTS "
                "FOR (n:PolicyRule) ON EACH [n.description]",
                database=database,
            )
            logger.info("  ✅ Full-text index: PolicyRule.description")
        except Exception as e:
            # Full-text index might already exist
            logger.debug("Full-text index note: %s", e)

    # ── convenience methods ───────────────────────────────────────────

    async def node_count(self, database: str = "neo4j") -> int:
        """Return total number of nodes in the database."""
        records = await self.run_query(
            "MATCH (n) RETURN count(n) AS count", database=database
        )
        return records[0]["count"] if records else 0

    async def relationship_count(self, database: str = "neo4j") -> int:
        """Return total number of relationships in the database."""
        records = await self.run_query(
            "MATCH ()-[r]->() RETURN count(r) AS count", database=database
        )
        return records[0]["count"] if records else 0