import { NextResponse } from "next/server";
import { getApplicationByToken } from "@/lib/repo/applications";

export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!token || token.length < 10) return NextResponse.json({ error: "Token inválido." }, { status: 400 });

  const application = await getApplicationByToken(token);
  if (!application) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  // Não devolve o token de acesso no payload para evitar vazamento por logs do cliente.
  const { accessToken: _ignored, ...safe } = application;
  return NextResponse.json({ application: safe });
}
