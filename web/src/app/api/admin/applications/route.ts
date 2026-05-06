import { NextResponse } from "next/server";
import { requireAdminOrThrow } from "@/lib/adminGuard";
import { listApplications } from "@/lib/repo/applications";

export async function GET() {
  try {
    await requireAdminOrThrow();
  } catch {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const applications = await listApplications({ limit: 500 });
  return NextResponse.json({ applications });
}

