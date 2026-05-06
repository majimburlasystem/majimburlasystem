"use client";

import Link from "next/link";
import { Container } from "@/components/Container";

export default function QuemSomosPage() {
  return (
    <Container className="py-12">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
          <span className="bg-gradient-to-r from-violet-400 to-pink-600 bg-clip-text text-transparent">
            Quem Somos
          </span>
        </h1>
        <p className="text-xl text-white/70">
          Conheca a EVO FILMS, uma empresa inovadora dedicada a descobrir e apoiar os melhores talentos do cinema adulto.
        </p>
      </div>

      {/* About Section */}
      <div className="max-w-4xl mx-auto grid gap-12 mb-16">
        {/* Missão */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8">
          <div className="flex gap-4 mb-4">
            <div className="text-4xl">🎬</div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Nossa Missão</h2>
              <p className="text-white/70 leading-relaxed">
                A EVO FILMS é uma empresa jovem e inovadora no mercado de conteúdo adulto profissional. 
                Nascemos com o propósito de revolucionar a indústria, trazendo tecnologia de ponta, segurança 
                e oportunidades reais para talentos que desejam iniciar suas carreiras no cinema adulto.
              </p>
            </div>
          </div>
        </div>

        {/* Propósito */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8">
          <div className="flex gap-4 mb-4">
            <div className="text-4xl">🌟</div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Em Busca de Novos Talentos</h2>
              <p className="text-white/70 leading-relaxed">
                Não importa a idade, experiência ou background. Estamos sempre em busca de indivíduos com 
                potencial, paixão e determinação. Se você é maior de 18 anos, confortável com sua sexualidade 
                e pronto para uma oportunidade única, você é bem-vindo na EVO FILMS.
              </p>
            </div>
          </div>
        </div>

        {/* Inovação */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8">
          <div className="flex gap-4 mb-4">
            <div className="text-4xl">⚡</div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Inovação no Ramo</h2>
              <p className="text-white/70 leading-relaxed">
                Utilizamos tecnologia de reconhecimento facial segura, processamento em navegador para 
                máxima privacidade, e um sistema de cadastro moderno que protege seus dados. Nossa plataforma 
                é 100% anônima na coleta de dados, com conformidade LGPD e segurança em primeiro lugar.
              </p>
            </div>
          </div>
        </div>

        {/* Valores */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8">
          <div className="flex gap-4 mb-4">
            <div className="text-4xl">💎</div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Nossos Valores</h2>
              <ul className="space-y-3 text-white/70">
                <li className="flex gap-3">
                  <span>✓</span>
                  <span><strong>Privacidade:</strong> Seus dados e imagens são tratados com máxima confidencialidade</span>
                </li>
                <li className="flex gap-3">
                  <span>✓</span>
                  <span><strong>Profissionalismo:</strong> Processo transparente e estruturado desde o cadastro</span>
                </li>
                <li className="flex gap-3">
                  <span>✓</span>
                  <span><strong>Oportunidade:</strong> Porta de entrada real para a indústria de conteúdo adulto</span>
                </li>
                <li className="flex gap-3">
                  <span>✓</span>
                  <span><strong>Segurança:</strong> Biometria segura e verificação de identidade confiável</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto text-center bg-gradient-to-r from-violet-500/10 to-pink-600/10 border border-violet-400/30 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-white mb-4">Pronto para Começar?</h3>
        <p className="text-white/70 mb-6">
          Se você tem interesse em fazer parte da EVO FILMS, o processo de cadastro é simples, 
          seguro e totalmente online. Basta fornecer seus dados, fotos e fazer a verificação biométrica.
        </p>
        <Link
          href="/cadastro"
          className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-violet-500 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/50 transition"
        >
          🚀 Iniciar Cadastro Agora
        </Link>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto mt-16">
        <h2 className="text-3xl font-bold text-white mb-8">Dúvidas Frequentes</h2>
        <div className="grid gap-6">
          <FAQItem
            q="Qual é a idade mínima?"
            a="Você precisa ter no mínimo 18 anos para se cadastrar na plataforma."
          />
          <FAQItem
            q="Meus dados são seguros?"
            a="Sim. Utilizamos criptografia, conformidade LGPD, e armazenamento seguro. Seus dados nunca são compartilhados sem consentimento."
          />
          <FAQItem
            q="Como funciona a verificação facial?"
            a="Fazemos uma checagem de similaridade entre sua selfie e o documento usando Face API. Tudo é processado no seu navegador, sem envio de imagens brutas."
          />
          <FAQItem
            q="Quanto tempo leva para aprovação?"
            a="O processo é rápido. Após enviar os dados, você receberá uma resposta em até 48 horas."
          />
          <FAQItem
            q="Posso permanecer anônimo?"
            a="O cadastro é confidencial. Seu email e dados de contato são protegidos."
          />
        </div>
      </div>
    </Container>
  );
}

function FAQItem(props: { q: string; a: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 hover:bg-white/10 transition">
      <h3 className="font-semibold text-white mb-2">{props.q}</h3>
      <p className="text-sm text-white/70">{props.a}</p>
    </div>
  );
}
