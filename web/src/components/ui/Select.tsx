import type { SelectHTMLAttributes } from "react";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const base =
    "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-violet-400/60";
  const { className, children, ...rest } = props;
  return (
    <select className={`${base} ${className ?? ""}`} {...rest}>
      {children}
    </select>
  );
}

