import { Container } from "@/components/Container";

export default function TermosPage() {
  return (
    <Container className="py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Termos de Uso</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/70">
        Página modelo. Para publicação, substitua por Termos de Uso revisados juridicamente, especialmente por envolver
        conteúdo adulto, verificação de maioridade e armazenamento de documentos.
      </p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Ao utilizar este portal, o usuário declara ser maior de 18 anos e autoriza o tratamento dos dados para cadastro e
        validação. O compartilhamento do token do painel é responsabilidade do usuário.
      </div>
    </Container>
  );
}

