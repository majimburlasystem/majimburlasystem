import { pbkdf2Sync, timingSafeEqual } from "node:crypto";

type Pbkdf2Hash = {
  algo: "pbkdf2_sha256";
  iterations: number;
  saltB64: string;
  hashB64: string;
};

export function parseAdminPasswordHash(hash: string): Pbkdf2Hash | null {
  const [algo, iterStr, saltB64, hashB64] = hash.split("$");
  if (algo !== "pbkdf2_sha256") return null;
  const iterations = Number(iterStr);
  if (!Number.isFinite(iterations) || iterations < 100_000) return null;
  if (!saltB64 || !hashB64) return null;
  return { algo, iterations, saltB64, hashB64 };
}

export function verifyAdminPassword(params: { password: string; storedHash: string }): boolean {
  const parsed = parseAdminPasswordHash(params.storedHash);
  if (!parsed) return false;

  const salt = Buffer.from(parsed.saltB64, "base64");
  const expected = Buffer.from(parsed.hashB64, "base64");

  const derived = pbkdf2Sync(params.password, salt, parsed.iterations, expected.length, "sha256");
  return timingSafeEqual(derived, expected);
}

