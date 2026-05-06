import type { InputHTMLAttributes } from "react";

export function Checkbox(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-white/20 bg-black/30 text-violet-400 focus:ring-violet-400/40"
      {...props}
    />
  );
}

