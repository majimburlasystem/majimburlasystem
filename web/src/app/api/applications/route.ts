import { NextResponse } from "next/server";
import { createApplicationSchema } from "@/lib/validation";
import { createApplication, type FileInput } from "@/lib/repo/applications";

export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Form inválido." }, { status: 400 });

  const rawInput = formDataToObject(form);
  const parsed = createApplicationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Campos inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!parsed.data.consentIsAdult || !parsed.data.consentPrivacy || !parsed.data.consentBiometrics) {
    return NextResponse.json({ error: "É necessário aceitar os termos e consentimentos." }, { status: 400 });
  }

  const files: FileInput[] = [];

  try {
    const documentFront = form.get("documentFront");
    if (!(documentFront instanceof File)) {
      return NextResponse.json({ error: "Envie a foto do documento (frente)." }, { status: 400 });
    }
    files.push(await fileToFileInput(documentFront, "document_front"));

    const documentBack = form.get("documentBack");
    if (documentBack instanceof File && documentBack.size > 0) {
      files.push(await fileToFileInput(documentBack, "document_back"));
    }

    const selfie = form.get("selfie");
    if (!(selfie instanceof File)) {
      return NextResponse.json({ error: "Capture/envie uma selfie." }, { status: 400 });
    }
    files.push(await fileToFileInput(selfie, "selfie"));

    for (const extra of form.getAll("extraDocuments")) {
      if (extra instanceof File && extra.size > 0) files.push(await fileToFileInput(extra, "extra"));
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Arquivo inválido.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const result = await createApplication({ input: parsed.data, files });
  return NextResponse.json({ ok: true, ...result }, { status: 201 });
}

function formDataToObject(form: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") obj[key] = value;
  }
  return obj;
}

async function fileToFileInput(file: File, kind: FileInput["kind"]): Promise<FileInput> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error(`Tipo de arquivo não permitido: ${file.type || "desconhecido"}`);
  }
  if (file.size <= 0) throw new Error("Arquivo vazio.");
  if (file.size > MAX_FILE_BYTES) throw new Error("Arquivo muito grande (máx 10MB).");

  const bytes = new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>;
  const sha256Hex = await sha256(bytes);
  return {
    kind,
    filename: file.name || null,
    mime: file.type,
    sizeBytes: file.size,
    sha256Hex,
    bytes,
  };
}

async function sha256(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const arr = Array.from(new Uint8Array(digest));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}
