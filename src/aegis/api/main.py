from fastapi import FastAPI
from aegis.config.settings import get_settings
from aegis.api.routes.documents import router as documents_router
from aegis.api.routes.extraction import router as extraction_router
settings = get_settings()

app = FastAPI(
    title="AegisHealth-KG API",
    description="API for the autonomous digital advocate system.",
    version="0.1.0",
)

app.include_router(documents_router)
app.include_router(extraction_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
