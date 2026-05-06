import { Container } from "@/components/Container";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/40">
      <Container className="py-8 text-xs text-white/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} EVO FILMES</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>Cadastro de talentos para produções de conteúdo adulto. Somente maiores de 18 anos.</span>
            <Link href="/termos" className="text-white/60 hover:text-white">
              Termos
            </Link>
            <Link href="/privacidade" className="text-white/60 hover:text-white">
              Privacidade
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
