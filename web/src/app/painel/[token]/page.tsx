import { Container } from "@/components/Container";
import { getApplicationByToken } from "@/lib/repo/applications";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function PainelPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const application = await getApplicationByToken(token);

  if (!application) {
    return (
      <Container className="py-14">
        <h1 className="text-2xl font-semibold">Painel</h1>
        <p className="mt-3 text-sm text-white/70">Token inválido ou cadastro não encontrado.</p>
      </Container>
    );
  }

  return (
    <Container className="py-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Painel do Talento</h1>
          <p className="mt-2 text-sm text-white/70">Status do cadastro e documentos enviados.</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-5">
          <Card title="Dados">
            <Row k="Tipo" v={application.performerType} />
            <Row k="Nome artístico" v={application.stageName} />
            <Row k="Nome civil" v={application.legalName} />
            <Row k="Email" v={application.email} />
            <Row k="Telefone" v={application.phone ?? "—"} />
            <Row k="Nascimento" v={application.birthDate} />
            <Row k="Nacionalidade" v={application.nationality ?? "—"} />
          </Card>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-white/60">
            Por segurança, as imagens são exibidas via link temporário baseado no seu token. Não compartilhe este link.
          </div>
        </section>

        <section className="lg:col-span-7">
          <Card title="Documentos e selfie">
            <div className="grid gap-4 sm:grid-cols-2">
              {application.files.map((f) => (
                <div key={f.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="text-xs font-medium text-white/80">{labelKind(f.kind)}</div>
                  <div className="mt-2 relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={labelKind(f.kind)}
                      src={`/api/files/${encodeURIComponent(f.id)}?token=${encodeURIComponent(token)}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-2 text-[11px] text-white/55">
                    {f.mime} • {formatBytes(f.sizeBytes)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </Container>
  );
}

function Card(props: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-sm font-medium text-white/90">{props.title}</h2>
      <div className="mt-4">{props.children}</div>
    </div>
  );
}


function Row(props: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2 text-sm">
      <div className="text-white/60">{props.k}</div>
      <div className="text-right text-white/90">{props.v}</div>
    </div>
  );
}

function StatusBadge(props: { status: string }) {
  const s = props.status;
  const { text, cls } =
    s === "approved"
      ? { text: "Aprovado", cls: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" }
      : s === "rejected"
        ? { text: "Reprovado", cls: "border-rose-400/25 bg-rose-400/10 text-rose-200" }
        : s === "reviewing"
          ? { text: "Em análise", cls: "border-amber-400/25 bg-amber-400/10 text-amber-200" }
          : { text: "Pendente", cls: "border-white/15 bg-white/5 text-white/80" };

  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${cls}`}>{text}</span>;
}

function labelKind(kind: string): string {
  switch (kind) {
    case "document_front":
      return "Documento (frente)";
    case "document_back":
      return "Documento (verso)";
    case "selfie":
      return "Selfie";
    default:
      return "Documento extra";
  }
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx++;
  }
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}
