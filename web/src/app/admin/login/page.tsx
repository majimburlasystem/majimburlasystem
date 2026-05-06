"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container } from "@/components/Container";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Falha no login.");
      router.push("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao entrar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="py-14">
      <div className="max-w-xl">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-sm text-white/70">Acesse o painel administrativo da EVO FILMES.</p>
      </div>

      <div className="mt-8 max-w-xl">
        <Card title="Entrar" subtitle="Use o email e senha configurados em `.env.local`.">
          {error ? (
            <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4">
            <label className="block">
              <div className="text-xs font-medium text-white/70">Email</div>
              <div className="mt-2">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@evofilmes.com" />
              </div>
            </label>
            <label className="block">
              <div className="text-xs font-medium text-white/70">Senha</div>
              <div className="mt-2">
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </label>

            <Button type="button" onClick={login} disabled={busy}>
              {busy ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </Card>
      </div>
    </Container>
  );
}

