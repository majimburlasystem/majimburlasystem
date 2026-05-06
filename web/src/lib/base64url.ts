export type Bytes = Uint8Array<ArrayBuffer>;

export function base64UrlEncode(bytes: Uint8Array): string {
  const b64 = bytesToBase64(bytes);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function base64UrlDecodeToBytes(input: string): Bytes {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLen);
  return base64ToBytes(padded);
}

export function utf8ToBytes(input: string): Bytes {
  return new TextEncoder().encode(input) as Bytes;
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function base64ToBytes(b64: string): Bytes {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length) as Bytes;
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
