import "server-only";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import fs from "node:fs/promises";
import path from "node:path";
import { getDataDir } from "@/lib/env";

type OpenDbResult = {
  SQL: SqlJsStatic;
  db: Database;
  dbFilePath: string;
  save: () => Promise<void>;
};

let sqlPromise: Promise<SqlJsStatic> | undefined;

function getSqlPromise(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    // Ensure `sql-wasm.wasm` is included in output file tracing (standalone builds).
    const wasmPath = require.resolve("sql.js/dist/sql-wasm.wasm");
    const distDir = path.dirname(wasmPath);
    sqlPromise = initSqlJs({
      locateFile: (file: string) => path.join(distDir, file),
    });
  }
  return sqlPromise;
}

async function openDb(): Promise<OpenDbResult> {
  const SQL = await getSqlPromise();

  const dataDir = getDataDir();
  const dbFilePath = path.join(process.cwd(), dataDir, "evo.db");
  await fs.mkdir(path.dirname(dbFilePath), { recursive: true });

  let db: Database;
  try {
    const fileBuffer = await fs.readFile(dbFilePath);
    db = new SQL.Database(new Uint8Array(fileBuffer));
  } catch {
    db = new SQL.Database();
  }

  migrate(db);

  return {
    SQL,
    db,
    dbFilePath,
    save: async () => {
      const bytes = db.export();
      await fs.writeFile(dbFilePath, Buffer.from(bytes));
    },
  };
}

function migrate(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      access_token TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL,

      performer_type TEXT NOT NULL,
      stage_name TEXT NOT NULL,
      legal_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      birth_date TEXT NOT NULL,
      cpf TEXT,
      nationality TEXT,

      address_zip TEXT,
      address_street TEXT,
      address_number TEXT,
      address_complement TEXT,
      address_city TEXT,
      address_state TEXT,
      address_country TEXT,

      doc_type TEXT,
      doc_number TEXT,
      doc_issuer TEXT,

      consent_is_adult INTEGER NOT NULL,
      consent_privacy INTEGER NOT NULL,
      consent_biometrics INTEGER NOT NULL,

      face_match_distance REAL,
      face_match_score REAL,
      face_model TEXT,
      selfie_descriptor_json TEXT,
      document_descriptor_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_applications_access_token ON applications(access_token);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      filename TEXT,
      mime TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      sha256_hex TEXT NOT NULL,
      created_at TEXT NOT NULL,
      bytes BLOB NOT NULL,
      FOREIGN KEY(application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_files_application_id ON files(application_id);
    CREATE INDEX IF NOT EXISTS idx_files_kind ON files(kind);
  `);
}

let writeQueue: Promise<void> = Promise.resolve();

export async function withDbRead<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const { db } = await openDb();
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

export async function withDbWrite<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const { db, save } = await openDb();
    try {
      const result = await fn(db);
      await save();
      return result;
    } finally {
      db.close();
    }
  };

  const resultPromise = writeQueue.then(run, run);
  writeQueue = resultPromise.then(
    () => undefined,
    () => undefined,
  );
  return resultPromise;
}
