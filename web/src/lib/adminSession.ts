import { base64UrlDecodeToBytes, base64UrlEncode, bytesToUtf8, utf8ToBytes, type Bytes } from "@/lib/base64url";

export const ADMIN_SESSION_COOKIE = "evo_admin_session";

type AdminSessionPayload = {
  v: 1;
  email: string;
  exp: number; // epoch seconds
};

export async function createAdminSessionToken(params: {
  email: string;
  secret: string;
  ttlSeconds?: number;
}): Promise<string> {
  const ttlSeconds = params.ttlSeconds ?? 60 * 60 * 8; // 8h
  const payload: AdminSessionPayload = {
    v: 1,
    email: params.email,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  const payloadPart = base64UrlEncode(utf8ToBytes(JSON.stringify(payload)));
  const signature = await hmacSign(params.secret, utf8ToBytes(payloadPart));
  const signaturePart = base64UrlEncode(signature);
  return `${payloadPart}.${signaturePart}`;
}

export async function verifyAdminSessionToken(params: {
  token: string;
  secret: string;
}): Promise<AdminSessionPayload | null> {
  const [payloadPart, signaturePart] = params.token.split(".");
  if (!payloadPart || !signaturePart) return null;

  const signatureBytes = base64UrlDecodeToBytes(signaturePart);
  const ok = await hmacVerify(params.secret, signatureBytes, utf8ToBytes(payloadPart));
  if (!ok) return null;

  let payload: AdminSessionPayload;
  try {
    payload = JSON.parse(bytesToUtf8(base64UrlDecodeToBytes(payloadPart))) as AdminSessionPayload;
  } catch {
    return null;
  }

  if (payload?.v !== 1) return null;
  if (!payload.email) return null;
  if (typeof payload.exp !== "number") return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    utf8ToBytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function hmacSign(secret: string, data: Bytes): Promise<Bytes> {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return new Uint8Array(sig) as Bytes;
}

async function hmacVerify(secret: string, signature: Bytes, data: Bytes): Promise<boolean> {
  const key = await importHmacKey(secret);
  return crypto.subtle.verify("HMAC", key, signature, data);
}
