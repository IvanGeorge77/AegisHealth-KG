/* ============================================================================
   Live API client — real `fetch()` calls to the FastAPI backend.
   ----------------------------------------------------------------------------
   Endpoints implemented today:
     POST /api/v1/documents/upload              (Phase 4)
     POST /api/v1/documents/{id}/extract        (Phase 5)

   To go live: set VITE_DATA_SOURCE=live, start the backend
   (`uvicorn src.aegis.api.main:app --reload`), and the UI switches over.
   No component changes required.
   ========================================================================= */

import { API_BASE_URL, type DataSource } from "./config";
import {
  ApiError,
  type ExtractionResponse,
  type UploadResponse,
} from "@/types/api";

/** Parses FastAPI's `{"detail": ...}` error shape into a usable message. */
async function toApiError(response: Response): Promise<ApiError> {
  let detail: string | undefined;
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") detail = body.detail;
    else if (Array.isArray(body?.detail)) {
      // FastAPI validation errors: [{ loc, msg, type }, ...]
      detail = body.detail
        .map((d: { loc?: unknown[]; msg?: string }) =>
          `${d.loc?.slice(1).join(".")}: ${d.msg ?? "invalid"}`,
        )
        .join("; ");
    }
  } catch {
    // Non-JSON error body — fall through with the status text.
  }

  const fallback = `${response.status} ${response.statusText}`;
  return new ApiError(detail ?? fallback, response.status, detail);
}

async function post<T>(path: string, body?: BodyInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      body,
    });
  } catch {
    // Network-level failure: backend down, wrong port, blocked by CORS.
    throw new ApiError(
      "Could not reach the AegisHealth-KG API. Is the backend running on port 8000?",
      0,
    );
  }

  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
}

/** POST /api/v1/documents/upload — multipart/form-data, field name "file". */
export function uploadDocument(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return post<UploadResponse>("/api/v1/documents/upload", form);
}

/** POST /api/v1/documents/{document_id}/extract */
export function runExtraction(
  documentId: string,
  useModel = false,
): Promise<ExtractionResponse> {
  const query = useModel ? "?use_model=true" : "";
  return post<ExtractionResponse>(
    `/api/v1/documents/${encodeURIComponent(documentId)}/extract${query}`,
  );
}

/** GET /health — used by the connection indicator in the top bar. */
export async function ping(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export const liveClient: AegisApiClient = {
  mode: "live" as DataSource,
  uploadDocument,
  runExtraction,
  ping,
};

export type AegisApiClient = {
  mode: DataSource;
  uploadDocument(file: File): Promise<UploadResponse>;
  runExtraction(documentId: string, useModel?: boolean): Promise<ExtractionResponse>;
  ping(): Promise<boolean>;
};