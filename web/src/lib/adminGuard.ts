import "server-only";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/adminSession";
import { getAdminEnv } from "@/lib/env";

export async function requireAdminOrThrow(): Promise<{ email: string }> {
  const { sessionSecret } = getAdminEnv();
  if (!sessionSecret) throw new Error("ADMIN_SESSION_SECRET não configurado");

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) throw new Error("Não autenticado");

  const session = await verifyAdminSessionToken({ token, secret: sessionSecret });
  if (!session) throw new Error("Sessão inválida");

  return { email: session.email };
}

