import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/Container";
import { Card } from "@/components/ui/Card";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { requireAdminOrThrow } from "@/lib/adminGuard";
import { listApplications } from "@/lib/repo/applications";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  try {
    await requireAdminOrThrow();
  } catch {
    redirect("/admin/login");
  }
  const applications = await listApplications({ limit: 500 });

  return (
    <Container className="py-12">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Painel Admin</h1>
          <p className="mt-2 text-sm text-white/70">Cadastros recebidos.</p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-8">
        <Card title="Cadastros" subtitle={`${applications.length} registros (mais recentes primeiro).`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-white/60">
                <tr className="border-b border-white/10">
                  <th className="py-3 pr-4">Data</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Tipo</th>
                  <th className="py-3 pr-4">Nome artístico</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id} className="border-b border-white/5">
                    <td className="py-3 pr-4 text-white/70">{formatDate(a.createdAt)}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80">
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-white/70">{a.performerType}</td>
                    <td className="py-3 pr-4 text-white/90">{a.stageName}</td>
                    <td className="py-3 pr-4 text-white/70">{a.email}</td>
                    <td className="py-3 pr-4 text-right">
                      <Link
                        href={`/admin/${encodeURIComponent(a.id)}`}
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/90 hover:bg-white/10"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Container>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}
