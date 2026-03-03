import os
import sqlite3
from pathlib import Path

import psycopg


BASE = Path(__file__).resolve().parent
SQLITE_PATH = BASE / "clientes.db"
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()


def main():
  if not DATABASE_URL:
    raise RuntimeError("Defina a variavel DATABASE_URL antes de rodar a migracao.")
  if not SQLITE_PATH.exists():
    raise RuntimeError(f"Arquivo SQLite nao encontrado: {SQLITE_PATH}")

  src = sqlite3.connect(SQLITE_PATH)
  src.row_factory = sqlite3.Row

  with psycopg.connect(DATABASE_URL) as dst:
    with dst.cursor() as cur:
      cur.execute(
        """
        CREATE TABLE IF NOT EXISTS clients(
          id BIGSERIAL PRIMARY KEY,
          email TEXT UNIQUE,
          phone TEXT UNIQUE,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          created_at BIGINT NOT NULL,
          oauth_provider TEXT,
          oauth_subject TEXT,
          avatar_user_id BIGINT,
          gender TEXT DEFAULT 'masculino'
        )
        """
      )

      rows = src.execute(
        """
        SELECT
          email,
          phone,
          password_hash,
          salt,
          created_at,
          oauth_provider,
          oauth_subject,
          avatar_user_id,
          COALESCE(NULLIF(TRIM(gender), ''), 'masculino') AS gender
        FROM clients
        """
      ).fetchall()

      for r in rows:
        cur.execute(
          """
          INSERT INTO clients (
            email, phone, password_hash, salt, created_at,
            oauth_provider, oauth_subject, avatar_user_id, gender
          ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
          ON CONFLICT (email) DO UPDATE SET
            phone = EXCLUDED.phone,
            password_hash = EXCLUDED.password_hash,
            salt = EXCLUDED.salt,
            created_at = EXCLUDED.created_at,
            oauth_provider = EXCLUDED.oauth_provider,
            oauth_subject = EXCLUDED.oauth_subject,
            avatar_user_id = EXCLUDED.avatar_user_id,
            gender = EXCLUDED.gender
          """,
          (
            r["email"],
            r["phone"],
            r["password_hash"],
            r["salt"],
            int(r["created_at"] or 0),
            r["oauth_provider"],
            r["oauth_subject"],
            r["avatar_user_id"],
            r["gender"],
          ),
        )

    dst.commit()

  src.close()
  print(f"Migracao concluida com sucesso. Registros processados: {len(rows)}")


if __name__ == "__main__":
  main()
