export type Step = { title: string; desc?: string };

export function Steps(props: { steps: Step[]; activeIndex: number }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-4">
      {props.steps.map((s, idx) => {
        const state = idx === props.activeIndex ? "active" : idx < props.activeIndex ? "done" : "todo";
        const cls =
          state === "active"
            ? "border-violet-400/40 bg-violet-400/10"
            : state === "done"
              ? "border-emerald-400/25 bg-emerald-400/10"
              : "border-white/10 bg-white/5";
        return (
          <li key={s.title} className={`rounded-xl border px-4 py-3 ${cls}`}>
            <div className="text-xs text-white/60">Etapa {idx + 1}</div>
            <div className="mt-1 text-sm font-medium text-white/90">{s.title}</div>
            {s.desc ? <div className="mt-1 text-xs text-white/55">{s.desc}</div> : null}
          </li>
        );
      })}
    </ol>
  );
}

