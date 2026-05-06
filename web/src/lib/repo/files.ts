import "server-only";
import { withDbRead } from "@/lib/db";
import type { Database } from "sql.js";

export type StoredFileWithBytes = {
  id: string;
  applicationId: string;
  kind: string;
  filename: string | null;
  mime: string;
  sizeBytes: number;
  sha256Hex: string;
  createdAt: string;
  bytes: Uint8Array<ArrayBuffer>;
};

export async function getFileById(id: string): Promise<StoredFileWithBytes | null> {
  return withDbRead((db) => getFileByIdTx(db, id));
}

function getFileByIdTx(db: Database, id: string): StoredFileWithBytes | null {
  const stmt = db.prepare(`
    SELECT id, application_id, kind, filename, mime, size_bytes, sha256_hex, created_at, bytes
    FROM files
    WHERE id = ?
    LIMIT 1;
  `);
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject() as Record<string, unknown>;
  const bytes = row.bytes as Uint8Array<ArrayBuffer> | undefined;
  stmt.free();

  if (!bytes) return null;

  return {
    id: String(row.id ?? ""),
    applicationId: String(row.application_id ?? ""),
    kind: String(row.kind ?? ""),
    filename: row.filename ? String(row.filename) : null,
    mime: String(row.mime ?? "application/octet-stream"),
    sizeBytes: Number(row.size_bytes ?? 0),
    sha256Hex: String(row.sha256_hex ?? ""),
    createdAt: String(row.created_at ?? ""),
    bytes,
  };
}
