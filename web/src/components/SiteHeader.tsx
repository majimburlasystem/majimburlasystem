import Link from "next/link";
import { Container } from "@/components/Container";

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-black/30">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-wide text-white">EVO</span>
          <span className="text-sm tracking-[0.25em] text-white/70">FILMS</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/quem-somos" className="text-white/80 hover:text-white transition">
            Quem Somos
          </Link>
          <Link href="/cadastro" className="text-white/80 hover:text-white transition">
            Cadastro
          </Link>
        </nav>
      </Container>
    </header>
  );
}

