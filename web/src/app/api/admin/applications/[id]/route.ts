import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrThrow } from "@/lib/adminGuard";
import { getApplicationById, updateApplicationStatus } from "@/lib/repo/applications";

const patchSchema = z.object({
  status: z.enum(["pending", "reviewing", "approved", "rejected"]),
});

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminOrThrow();
  } catch {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await context.params;
  const application = await getApplicationById(id);
  if (!application) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  return NextResponse.json({ application });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminOrThrow();
  } catch {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Payload inválido." }, { status: 400 });

  await updateApplicationStatus({ id, status: parsed.data.status });
  return NextResponse.json({ ok: true });
}
