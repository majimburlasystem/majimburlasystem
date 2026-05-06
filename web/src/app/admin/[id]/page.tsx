import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/Container";
import { Card } from "@/components/ui/Card";
import { StatusUpdater } from "@/components/admin/StatusUpdater";
import { requireAdminOrThrow } from "@/lib/adminGuard";
import { getApplicationById } from "@/lib/repo/applications";

export const dynamic = "force-dynamic";

export default async function AdminApplicationPage(props: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminOrThrow();
  } catch {
    redirect("/admin/login");
  }
  const { id } = await props.params;
  const application = await getApplicationById(id);

  if (!application) {
    return (
      <Container className="py-14">
        <h1 className="text-2xl font-semibold">Não encontrado</h1>
        <p className="mt-3 text-sm text-white/70">Cadastro inexistente.</p>
        <div className="mt-6">
          <Link href="/admin" className="text-sm text-white/80 hover:text-white">
            ← Voltar
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="flex items-end justify-between gap-6">
        <div>
          <Link href="/admin" className="text-sm text-white/70 hover:text-white">
            ← Voltar
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Cadastro</h1>
          <p className="mt-2 text-sm text-white/70">{application.stageName}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-5">
          <StatusUpdater applicationId={application.id} initialStatus={application.status} />

          <div className="mt-6">
            <Card title="Dados">
              <Row k="Tipo" v={application.performerType} />
              <Row k="Nome artístico" v={application.stageName} />
              <Row k="Nome civil" v={application.legalName} />
              <Row k="Email" v={application.email} />
              <Row k="Telefone" v={application.phone ?? "—"} />
              <Row k="Nascimento" v={application.birthDate} />
              <Row k="CPF" v={application.cpf ?? "—"} />
              <Row k="Nacionalidade" v={application.nationality ?? "—"} />
              <Row k="Documento" v={[application.docType, application.docNumber].filter(Boolean).join(" ")} />
              <Row k="Órgão emissor" v={application.docIssuer ?? "—"} />
            </Card>
          </div>

          <div className="mt-6">
            <Card title="Face Match">
              <Row k="Distância" v={application.faceMatchDistance?.toFixed(4) ?? "—"} />
              <Row k="Score" v={application.faceMatchScore !== null && application.faceMatchScore !== undefined ? `${Math.round(application.faceMatchScore * 100)}%` : "—"} />
              <Row k="Modelo" v={application.faceModel ?? "—"} />
            </Card>
          </div>
        </section>

        <section className="lg:col-span-7">
          <Card title="Arquivos" subtitle="Documentos e selfie (armazenados no banco).">
            <div className="grid gap-4 sm:grid-cols-2">
              {application.files.map((f) => (
                <div key={f.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="text-xs font-medium text-white/80">{labelKind(f.kind)}</div>
                  <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/files/${encodeURIComponent(f.id)}`} alt={labelKind(f.kind)} className="aspect-[4/3] w-full object-cover" />
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

function Row(props: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2 text-sm">
      <div className="text-white/60">{props.k}</div>
      <div className="text-right text-white/90">{props.v || "—"}</div>
    </div>
  );
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
