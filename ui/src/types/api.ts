/* ============================================================================
   API contract types — mirror of the FastAPI Pydantic models.
   ----------------------------------------------------------------------------
   Source of truth:
     src/aegis/models/document.py   → UploadResponse
     src/aegis/models/entities.py   → EntitySpan, ExtractedEntities,
                                      ExtractionResponse

   Keep these in sync with the backend. They are intentionally duplicated here
   rather than generated, because the frontend ships independently of FastAPI.
   ========================================================================= */

/** POST /api/v1/documents/upload → UploadResponse */
export interface UploadResponse {
  document_id: string;
  filename: string;
  content_type: string;
  page_count: number;
  extracted_text_preview: string;
}

/** ExtractedEntities — list-valued fields are EntitySpan[], scalars are nullable. */
export interface ExtractedEntities {
  icd10_codes: EntitySpan[];
  cpt_codes: EntitySpan[];
  denial_codes: EntitySpan[]; // CARC codes, e.g. CO-167 / PR-197
  payer_name: string | null;
  provider_npi: string | null;
  member_id: string | null;
  claim_id: string | null;
  policy_id: string | null;
}

/** A single extracted entity with its provenance. */
export interface EntitySpan {
  text: string;
  normalized: string;
  category: string;
  /** 'regex' | 'ner_model' | 'both' — how the entity was found. */
  source: string;
  start_char: number | null;
  end_char: number | null;
}

/** POST /api/v1/documents/{document_id}/extract → ExtractionResponse */
export interface ExtractionResponse {
  document_id: string;
  filename: string;
  entities: ExtractedEntities;
  raw_entity_count: number;
}

/** Normalised HTTP error thrown by the live API client. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}