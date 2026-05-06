import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/adminSession";
import { verifyAdminPassword } from "@/lib/adminPassword";
import { getAdminEnv } from "@/lib/env";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { adminEmail, sessionSecret, passwordHash } = getAdminEnv();
  if (!sessionSecret || !passwordHash) {
    return NextResponse.json(
      { error: "Servidor não configurado. Configure `.env.local`." },
      { status: 500 },
    );
  }

  if (parsed.data.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  const ok = verifyAdminPassword({ password: parsed.data.password, storedHash: passwordHash });
  if (!ok) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  const token = await createAdminSessionToken({ email: adminEmail, secret: sessionSecret });
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return res;
}

