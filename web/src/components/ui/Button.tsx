import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const variant = props.variant ?? "primary";
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium outline-none transition disabled:cursor-not-allowed disabled:opacity-40";
  const variants: Record<Variant, string> = {
    primary: "bg-white text-black hover:bg-white/90",
    secondary: "border border-white/15 bg-white/5 text-white/90 hover:bg-white/10",
    ghost: "text-white/80 hover:text-white",
  };

  const { className, variant: _v, ...rest } = props;
  return <button className={`${base} ${variants[variant]} ${className ?? ""}`} {...rest} />;
}

