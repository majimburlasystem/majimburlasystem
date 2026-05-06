import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const base =
    "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-violet-400/60";
  const { className, ...rest } = props;
  return <input className={`${base} ${className ?? ""}`} {...rest} />;
}

