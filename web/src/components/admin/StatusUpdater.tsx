"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

const statuses = ["pending", "reviewing", "approved", "rejected"] as const;

export function StatusUpdater(props: { applicationId: string; initialStatus: string }) {
  const [status, setStatus] = useState(props.initialStatus);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/applications/${encodeURIComponent(props.applicationId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Falha ao atualizar.");
      setMsg("Status atualizado.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="text-sm font-medium text-white/90">Status</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <div className="text-xs font-medium text-white/60">Situação</div>
          <div className="mt-2">
            <Select value={status} onChange={(e) => setStatus(e.target.value)} disabled={busy}>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <Button type="button" onClick={save} disabled={busy}>
          {busy ? "Salvando..." : "Salvar"}
        </Button>
      </div>
      {msg ? <div className="mt-3 text-xs text-white/60">{msg}</div> : null}
    </div>
  );
}

