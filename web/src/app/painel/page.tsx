"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container } from "@/components/Container";

export default function PainelEntryPage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  return (
    <Container className="py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Acessar meu painel</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
        Informe o token recebido ao final do cadastro para visualizar seus dados e o status.
      </p>

      <div className="mt-8 max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <label className="text-xs font-medium text-white/70">Token</label>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Cole aqui o token (ex: xxxxxxxxx...)"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-violet-400/60"
        />
        <button
          type="button"
          onClick={() => router.push(`/painel/${encodeURIComponent(token.trim())}`)}
          disabled={token.trim().length < 10}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          Entrar
        </button>
      </div>
    </Container>
  );
}

