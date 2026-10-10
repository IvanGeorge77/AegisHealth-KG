import { useRef, useState, type DragEvent } from "react";
import { AlertCircle, FileText, Loader2, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FileInput, Field } from "@/components/ui/input";
import { DataRow, Separator } from "@/components/ui/primitives";
import { Notice } from "@/components/common/placeholders";
import { Badge } from "@/components/ui/badge";
import { UPLOAD_LIMITS } from "@/api";
import { useDataSource } from "@/state/data-source";
import { describeFileKind, formatBytes, validateUpload } from "@/lib/validate";
import { usePipeline } from "@/state/pipeline";
import type { UploadResponse } from "@/types/api";

/* ============================================================================
   Step 1 — Document Upload   (Phase 4 · backend implemented)
   ----------------------------------------------------------------------------
   Calls: POST /api/v1/documents/upload  (multipart/form-data, field "file")
   Returns: UploadResponse { document_id, filename, content_type,
                             page_count, extracted_text_preview }

   The preview is the first 500 characters only — the full text is stored
   server-side and never sent to the browser. The UI says so, because a
   truncated preview presented as "the document" would be misleading.
   ========================================================================= */

export function StepUpload() {
  const { submitDocument, upload, statuses, errors } = usePipeline();
  const { mode } = useDataSource();

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = statuses.upload === "processing";

  function accept(candidate: File | undefined | null) {
    if (!candidate) return;
    const result = validateUpload(candidate);
    if (!result.ok) {
      setFile(null);
      setFileError(result.error);
      return;
    }
    setFileError(undefined);
    setFile(candidate);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files?.[0]);
  }

  function clear() {
    setFile(null);
    setFileError(undefined);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onSubmit() {
    if (!file) return;
    await submitDocument(file);
  }

  return (
    <div className="space-y-6">
      {upload ? (
        <UploadSuccess result={upload} onReplace={clear} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          {/* Drop zone */}
          <div className="space-y-4">
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              htmlFor="document-file"
              className={
                dragging
                  ? "flex min-h-[16rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-xs border-2 border-dashed border-forest bg-forest-soft/60 px-6 py-10 text-center transition-colors"
                  : "flex min-h-[16rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-xs border-2 border-dashed border-stone bg-surface px-6 py-10 text-center transition-colors hover:border-slate"
              }
            >
              <UploadCloud
                className={dragging ? "size-7 text-forest" : "size-7 text-slate"}
                aria-hidden="true"
              />
              <span className="font-serif text-[1.125rem] text-ink">
                Drop a denial letter here
              </span>
              <span className="max-w-[42ch] text-caption text-slate">
                or select a file. Denial letters, explanation of benefits, clinical notes and
                supporting documentation are accepted.
              </span>
              <span className="ak-mono mt-1 text-slate">
                .pdf or .txt · up to {UPLOAD_LIMITS.maxSizeMb} MB
              </span>
            </label>

            <Field
              label="Or choose a file"
              htmlFor="document-file"
              error={fileError}
              hint="Keyboard accessible alternative to the drop zone."
            >
              <FileInput
                id="document-file"
                ref={inputRef}
                accept=".pdf,.txt,application/pdf,text/plain"
                onChange={(event) => accept(event.target.files?.[0])}
                disabled={busy}
              />
            </Field>

            {errors.upload ? (
              <Notice tone="rust" title="Upload failed" icon={AlertCircle}>
                <p>{errors.upload}</p>
                <p className="mt-1">
                  Nothing was stored. Correct the problem and submit again.
                </p>
              </Notice>
            ) : null}
          </div>

          {/* Constraints + request */}
          <aside className="space-y-4">
            <div className="rounded-xs border border-stone bg-surface">
              <p className="ak-label border-b border-stone px-4 py-2.5">Accepted input</p>
              <ul className="space-y-2 px-4 py-3 text-caption text-slate">
                <li>
                  <span className="ak-mono text-ink">application/pdf</span> — text-based PDF
                </li>
                <li>
                  <span className="ak-mono text-ink">text/plain</span> — plain text
                </li>
                <li>
                  Maximum{" "}
                  <span className="ak-mono text-ink">{UPLOAD_LIMITS.maxSizeMb} MB</span> per
                  file
                </li>
              </ul>
              <Separator />
              <p className="px-4 py-3 text-caption text-slate">
                Scanned images are not supported. The parser reads embedded text only, so an
                image-only PDF will return no content.
              </p>
            </div>

            <div className="space-y-3 rounded-xs border border-stone bg-surface p-4">
              {file ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 size-4 shrink-0 text-slate" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.875rem] font-medium text-ink">
                        {file.name}
                      </p>
                      <p className="text-caption text-slate">
                        {describeFileKind(file.name)} · {formatBytes(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clear}
                      className="rounded-xs p-1 text-slate hover:bg-paper hover:text-ink"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-caption text-slate">No file selected yet.</p>
              )}

              <Button onClick={onSubmit} disabled={!file || busy} block>
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Uploading &amp; extracting text…
                  </>
                ) : (
                  <>
                    <UploadCloud className="size-4" aria-hidden="true" />
                    Submit document
                  </>
                )}
              </Button>

              <p className="ak-mono text-note leading-relaxed text-slate">
                POST /api/v1/documents/upload
                <br />
                {mode === "mock" ? "mock transport" : "http://localhost:8000"}
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ── Success view ───────────────────────────────────────────────────────── */

function UploadSuccess({
  result,
  onReplace,
}: {
  result: UploadResponse;
  onReplace: () => void;
}) {
  const truncated = result.extracted_text_preview.length >= 500;

  return (
    <div className="space-y-5">
      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        {/* Document record */}
        <div className="rounded-xs border border-stone bg-surface">
          <div className="flex items-center justify-between gap-2 border-b border-stone px-4 py-2.5">
            <p className="ak-label">Document record</p>
            <Badge tone="forest" size="md">
              Stored
            </Badge>
          </div>
          <dl className="px-4 py-1">
            <DataRow
              label="document_id"
              value={result.document_id}
              mono
            />
            <DataRow label="filename" value={result.filename} mono />
            <DataRow label="content_type" value={result.content_type} mono />
            <DataRow label="page_count" value={result.page_count} />
          </dl>
          <div className="border-t border-stone px-4 py-3">
            <Button variant="secondary" size="sm" onClick={onReplace}>
              Upload a different document
            </Button>
          </div>
        </div>

        {/* Extracted text preview */}
        <div className="flex min-h-[22rem] flex-col rounded-xs border border-stone bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone px-4 py-2.5">
            <p className="ak-label">Extracted text preview</p>
            <p className="ak-mono text-slate">
              {result.extracted_text_preview.length} characters
              {truncated ? " · truncated by the API" : ""}
            </p>
          </div>
          <div
            className="ak-scroll max-h-[28rem] flex-1 bg-surface px-5 py-4 font-mono text-[0.8125rem] leading-relaxed text-ink"
            tabIndex={0}
            role="region"
            aria-label="Extracted text preview, scrollable"
          >
            <pre className="whitespace-pre-wrap break-words">{result.extracted_text_preview}</pre>
          </div>
        </div>
      </div>

      <Notice tone="neutral">
        The preview above is the first 500 characters of the extracted text, as returned by
        the API. The complete text is stored server-side under the document id and is never
        sent to the browser.
      </Notice>
    </div>
  );
}