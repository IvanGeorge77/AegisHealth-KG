import { UPLOAD_LIMITS } from "@/api";

/* ============================================================================
   Upload validation
   ----------------------------------------------------------------------------
   Mirrors the constraints enforced server-side in
   `src/aegis/api/routes/documents.py`. Validating in the browser is a
   convenience only — the backend remains the authority and its 413/415
   responses are surfaced verbatim to the user.
   ========================================================================= */

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

const EXTENSION_PATTERN = new RegExp(
  `${UPLOAD_LIMITS.allowedExtensions.map((ext) => ext.replace(".", "\\.")).join("|")}$`,
  "i",
);

export function validateUpload(file: File): ValidationResult {
  const isAllowedType = (UPLOAD_LIMITS.allowedContentTypes as readonly string[]).includes(
    file.type,
  );
  const hasAllowedExtension = EXTENSION_PATTERN.test(file.name);

  if (!isAllowedType && !hasAllowedExtension) {
    return {
      ok: false,
      error: `Unsupported file type. Accepted formats: PDF, TXT.`,
    };
  }

  const maxBytes = UPLOAD_LIMITS.maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `File is ${formatBytes(file.size)}. The maximum accepted size is ${UPLOAD_LIMITS.maxSizeMb} MB.`,
    };
  }

  if (file.size === 0) {
    return { ok: false, error: "This file is empty." };
  }

  return { ok: true };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Short label for a document type, derived from its filename. */
export function describeFileKind(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("denial")) return "Denial letter";
  if (lower.includes("eob") || lower.includes("explanation")) return "Explanation of benefits";
  if (lower.includes("note") || lower.includes("chart")) return "Clinical note";
  if (lower.includes("policy")) return "Policy document";
  return "Supporting document";
}