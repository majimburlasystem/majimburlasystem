import type { ReactNode } from "react";

export function Card(props: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium text-white/90">{props.title}</h2>
        {props.subtitle ? <p className="text-xs text-white/60">{props.subtitle}</p> : null}
      </div>
      <div className="mt-5">{props.children}</div>
    </div>
  );
}

