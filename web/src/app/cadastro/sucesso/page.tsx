"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/Container";

export default function CadastroSucessoPage() {
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";

  return (
    <Container className="py-14">
      <div className="max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
          Cadastro enviado
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Tudo certo!</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Seu cadastro foi recebido. Guarde este token com segurança para acessar seu painel e acompanhar o status.
        </p>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
          <div className="text-xs font-medium text-white/70">Token</div>
          <div className="mt-2 break-all font-mono text-sm text-white">{token || "—"}</div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={token ? `/painel/${encodeURIComponent(token)}` : "/painel"}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-medium text-black hover:bg-white/90"
          >
            Abrir painel
          </Link>
          <Link
            href="/"
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 hover:bg-white/10"
          >
            Voltar ao início
          </Link>
        </div>

        <div className="mt-6 text-xs text-white/55">
          Dica: se possível, salve o token em um gerenciador de senhas.
        </div>
      </div>
    </Container>
  );
}

