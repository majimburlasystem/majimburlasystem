import type { ReactNode } from "react";

export function Container(props: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 ${props.className ?? ""}`}>{props.children}</div>;
}

