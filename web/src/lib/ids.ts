import { nanoid } from "nanoid";

export function newId(prefix?: string): string {
  const id = nanoid(24);
  return prefix ? `${prefix}_${id}` : id;
}

export function newAccessToken(): string {
  return nanoid(40);
}

