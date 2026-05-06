import "server-only";
import type { Database } from "sql.js";
import { withDbRead, withDbWrite } from "@/lib/db";
import { newAccessToken, newId } from "@/lib/ids";
import type { CreateApplicationInput } from "@/lib/validation";

export type ApplicationRecord = {
  id: string;
  accessToken: string;
  createdAt: string;
  updatedAt: string;
  status: string;

  performerType: string;
  stageName: string;
  legalName: string;
  email: string;
  phone: string | null;
  birthDate: string;
  cpf: string | null;
  nationality: string | null;

  addressZip: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressCountry: string | null;

  docType: string | null;
  docNumber: string | null;
  docIssuer: string | null;

  consentIsAdult: number;
  consentPrivacy: number;
  consentBiometrics: number;

  faceMatchDistance: number | null;
  faceMatchScore: number | null;
  faceModel: string | null;
  selfieDescriptorJson: string | null;
  documentDescriptorJson: string | null;
};

export type FileInput = {
  kind:
    | "document_front"
    | "document_back"
    | "selfie"
    | "extra";
  filename: string | null;
  mime: string;
  sizeBytes: number;
  sha256Hex: string;
  bytes: Uint8Array;
};

export type StoredFileRecord = {
  id: string;
  kind: string;
  filename: string | null;
  mime: string;
  sizeBytes: number;
  sha256Hex: string;
  createdAt: string;
};

export type CreateApplicationResult = {
  applicationId: string;
  accessToken: string;
  files: StoredFileRecord[];
};

export async function createApplication(params: {
  input: CreateApplicationInput;
  files: FileInput[];
}): Promise<CreateApplicationResult> {
  return withDbWrite((db) => createApplicationTx(db, params.input, params.files));
}

function createApplicationTx(db: Database, input: CreateApplicationInput, files: FileInput[]): CreateApplicationResult {
  const now = new Date().toISOString();
  const applicationId = newId("app");
  const accessToken = newAccessToken();

  const insert = db.prepare(`
    INSERT INTO applications (
      id, access_token, created_at, updated_at, status,
      performer_type, stage_name, legal_name, email, phone, birth_date, cpf, nationality,
      address_zip, address_street, address_number, address_complement, address_city, address_state, address_country,
      doc_type, doc_number, doc_issuer,
      consent_is_adult, consent_privacy, consent_biometrics,
      face_match_distance, face_match_score, face_model, selfie_descriptor_json, document_descriptor_json
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?
    );
  `);

  insert.run([
    applicationId,
    accessToken,
    now,
    now,
    "pending",

    input.performerType,
    input.stageName,
    input.legalName,
    input.email,
    emptyToNull(input.phone),
    input.birthDate,
    emptyToNull(input.cpf),
    emptyToNull(input.nationality),

    emptyToNull(input.addressZip),
    emptyToNull(input.addressStreet),
    emptyToNull(input.addressNumber),
    emptyToNull(input.addressComplement),
    emptyToNull(input.addressCity),
    emptyToNull(input.addressState),
    emptyToNull(input.addressCountry),

    emptyToNull(input.docType),
    emptyToNull(input.docNumber),
    emptyToNull(input.docIssuer),

    input.consentIsAdult ? 1 : 0,
    input.consentPrivacy ? 1 : 0,
    input.consentBiometrics ? 1 : 0,

    input.faceMatchDistance ?? null,
    input.faceMatchScore ?? null,
    emptyToNull(input.faceModel),
    emptyToNull(input.selfieDescriptorJson),
    emptyToNull(input.documentDescriptorJson),
  ]);
  insert.free();

  const storedFiles: StoredFileRecord[] = [];
  for (const file of files) {
    const id = newId("file");
    const stmt = db.prepare(`
      INSERT INTO files (
        id, application_id, kind, filename, mime, size_bytes, sha256_hex, created_at, bytes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
    stmt.run([
      id,
      applicationId,
      file.kind,
      file.filename,
      file.mime,
      file.sizeBytes,
      file.sha256Hex,
      now,
      file.bytes,
    ]);
    stmt.free();
    storedFiles.push({
      id,
      kind: file.kind,
      filename: file.filename,
      mime: file.mime,
      sizeBytes: file.sizeBytes,
      sha256Hex: file.sha256Hex,
      createdAt: now,
    });
  }

  return { applicationId, accessToken, files: storedFiles };
}

export async function listApplications(params?: { limit?: number }): Promise<ApplicationRecord[]> {
  const limit = Math.min(Math.max(params?.limit ?? 200, 1), 1000);
  return withDbRead((db) => {
    const stmt = db.prepare(`
      SELECT
        id, access_token, created_at, updated_at, status,
        performer_type, stage_name, legal_name, email, phone, birth_date, cpf, nationality,
        address_zip, address_street, address_number, address_complement, address_city, address_state, address_country,
        doc_type, doc_number, doc_issuer,
        consent_is_adult, consent_privacy, consent_biometrics,
        face_match_distance, face_match_score, face_model, selfie_descriptor_json, document_descriptor_json
      FROM applications
      ORDER BY created_at DESC
      LIMIT ?;
    `);
    stmt.bind([limit]);
    const rows: ApplicationRecord[] = [];
    while (stmt.step()) {
      const r = stmt.getAsObject() as Record<string, unknown>;
      rows.push(mapApplicationRow(r));
    }
    stmt.free();
    return rows;
  });
}

export async function getApplicationByToken(accessToken: string): Promise<(ApplicationRecord & { files: StoredFileRecord[] }) | null> {
  return withDbRead((db) => getApplicationByTokenTx(db, accessToken));
}

function getApplicationByTokenTx(db: Database, accessToken: string): (ApplicationRecord & { files: StoredFileRecord[] }) | null {
  const stmt = db.prepare(`
    SELECT
      id, access_token, created_at, updated_at, status,
      performer_type, stage_name, legal_name, email, phone, birth_date, cpf, nationality,
      address_zip, address_street, address_number, address_complement, address_city, address_state, address_country,
      doc_type, doc_number, doc_issuer,
      consent_is_adult, consent_privacy, consent_biometrics,
      face_match_distance, face_match_score, face_model, selfie_descriptor_json, document_descriptor_json
    FROM applications
    WHERE access_token = ?
    LIMIT 1;
  `);
  stmt.bind([accessToken]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject() as Record<string, unknown>;
  stmt.free();

  const application = mapApplicationRow(row);
  const files = listFilesForApplicationTx(db, application.id);
  return { ...application, files };
}

export async function getApplicationById(id: string): Promise<(ApplicationRecord & { files: StoredFileRecord[] }) | null> {
  return withDbRead((db) => {
    const stmt = db.prepare(`
      SELECT
        id, access_token, created_at, updated_at, status,
        performer_type, stage_name, legal_name, email, phone, birth_date, cpf, nationality,
        address_zip, address_street, address_number, address_complement, address_city, address_state, address_country,
        doc_type, doc_number, doc_issuer,
        consent_is_adult, consent_privacy, consent_biometrics,
        face_match_distance, face_match_score, face_model, selfie_descriptor_json, document_descriptor_json
      FROM applications
      WHERE id = ?
      LIMIT 1;
    `);
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject() as Record<string, unknown>;
    stmt.free();
    const application = mapApplicationRow(row);
    const files = listFilesForApplicationTx(db, application.id);
    return { ...application, files };
  });
}

export async function updateApplicationStatus(params: { id: string; status: string }): Promise<void> {
  return withDbWrite((db) => {
    const now = new Date().toISOString();
    const stmt = db.prepare(`UPDATE applications SET status = ?, updated_at = ? WHERE id = ?;`);
    stmt.run([params.status, now, params.id]);
    stmt.free();
  });
}

function listFilesForApplicationTx(db: Database, applicationId: string): StoredFileRecord[] {
  const stmt = db.prepare(`
    SELECT id, kind, filename, mime, size_bytes, sha256_hex, created_at
    FROM files
    WHERE application_id = ?
    ORDER BY created_at ASC;
  `);
  stmt.bind([applicationId]);
  const rows: StoredFileRecord[] = [];
  while (stmt.step()) {
    const r = stmt.getAsObject() as Record<string, unknown>;
    rows.push({
      id: String(r.id ?? ""),
      kind: String(r.kind ?? ""),
      filename: r.filename ? String(r.filename) : null,
      mime: String(r.mime ?? "application/octet-stream"),
      sizeBytes: Number(r.size_bytes ?? 0),
      sha256Hex: String(r.sha256_hex ?? ""),
      createdAt: String(r.created_at ?? ""),
    });
  }
  stmt.free();
  return rows;
}

function mapApplicationRow(r: Record<string, unknown>): ApplicationRecord {
  return {
    id: String(r.id ?? ""),
    accessToken: String(r.access_token ?? ""),
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? ""),
    status: String(r.status ?? ""),

    performerType: String(r.performer_type ?? ""),
    stageName: String(r.stage_name ?? ""),
    legalName: String(r.legal_name ?? ""),
    email: String(r.email ?? ""),
    phone: r.phone ? String(r.phone) : null,
    birthDate: String(r.birth_date ?? ""),
    cpf: r.cpf ? String(r.cpf) : null,
    nationality: r.nationality ? String(r.nationality) : null,

    addressZip: r.address_zip ? String(r.address_zip) : null,
    addressStreet: r.address_street ? String(r.address_street) : null,
    addressNumber: r.address_number ? String(r.address_number) : null,
    addressComplement: r.address_complement ? String(r.address_complement) : null,
    addressCity: r.address_city ? String(r.address_city) : null,
    addressState: r.address_state ? String(r.address_state) : null,
    addressCountry: r.address_country ? String(r.address_country) : null,

    docType: r.doc_type ? String(r.doc_type) : null,
    docNumber: r.doc_number ? String(r.doc_number) : null,
    docIssuer: r.doc_issuer ? String(r.doc_issuer) : null,

    consentIsAdult: Number(r.consent_is_adult ?? 0),
    consentPrivacy: Number(r.consent_privacy ?? 0),
    consentBiometrics: Number(r.consent_biometrics ?? 0),

    faceMatchDistance: r.face_match_distance === null || r.face_match_distance === undefined ? null : Number(r.face_match_distance),
    faceMatchScore: r.face_match_score === null || r.face_match_score === undefined ? null : Number(r.face_match_score),
    faceModel: r.face_model ? String(r.face_model) : null,
    selfieDescriptorJson: r.selfie_descriptor_json ? String(r.selfie_descriptor_json) : null,
    documentDescriptorJson: r.document_descriptor_json ? String(r.document_descriptor_json) : null,
  };
}

function emptyToNull(value: string | undefined): string | null {
  const v = (value ?? "").trim();
  return v.length ? v : null;
}

