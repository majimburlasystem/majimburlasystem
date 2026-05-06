import { Container } from "@/components/Container";

export default function PrivacidadePage() {
  return (
    <Container className="py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Política de Privacidade</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/70">
        Esta é uma página modelo. Para publicar, substitua este conteúdo por uma Política de Privacidade adequada ao seu
        caso, incluindo: finalidade do tratamento, bases legais (LGPD), retenção, compartilhamento, medidas de segurança e
        canal de contato do encarregado (DPO), quando aplicável.
      </p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        O portal da EVO FILMES pode coletar dados pessoais, fotos de documentos e dados biométricos (selfie/descritor
        facial) para fins de cadastro e validação de identidade. O acesso a esses dados deve ser restrito e auditado.
      </div>
    </Container>
  );
}

