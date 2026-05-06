import { cookies } from "next/headers";
import { getAdminEnv } from "@/lib/env";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/adminSession";
import { getApplicationByToken } from "@/lib/repo/applications";
import { getFileById } from "@/lib/repo/files";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const file = await getFileById(id);
  if (!file) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const accessToken = url.searchParams.get("token");

  const isAdmin = await isAdminSessionValid();
  if (!isAdmin) {
    if (!accessToken) return new Response("Unauthorized", { status: 401 });
    const app = await getApplicationByToken(accessToken);
    if (!app || app.id !== file.applicationId) return new Response("Forbidden", { status: 403 });
  }

  return new Response(file.bytes, {
    status: 200,
    headers: {
      "Content-Type": file.mime,
      "Content-Length": String(file.sizeBytes),
      "Cache-Control": "no-store",
      "Content-Disposition": contentDisposition(file.filename, file.kind),
    },
  });
}

async function isAdminSessionValid(): Promise<boolean> {
  const { sessionSecret } = getAdminEnv();
  if (!sessionSecret) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  const session = await verifyAdminSessionToken({ token, secret: sessionSecret });
  return Boolean(session);
}

function contentDisposition(filename: string | null, kind: string): string {
  const safeName = (filename && sanitizeFilename(filename)) || `${kind}.bin`;
  return `inline; filename="${safeName}"`;
}

function sanitizeFilename(input: string): string {
  // remove path separators and quotes
  return input.replace(/[\\\/"]/g, "_");
}
