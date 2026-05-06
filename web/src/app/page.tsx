"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";

const carouselItems = [
  {
    id: 1,
    title: "Empresa Inovadora",
    desc: "EVO FILMS é jovem, dinâmica e disruptiva no mercado de conteúdo adulto profissional",
    image: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    icon: "🚀",
  },
  {
    id: 2,
    title: "Buscamos Novos Talentos",
    desc: "Não importa a idade ou experiência. Se você é maior de 18, estamos interessados em você",
    image: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    icon: "⭐",
  },
  {
    id: 3,
    title: "Inovação e Segurança",
    desc: "Tecnologia de ponta com reconhecimento facial seguro e total conformidade LGPD",
    image: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    icon: "🔒",
  },
  {
    id: 4,
    title: "Oportunidade Real",
    desc: "Entrada profissional e legítima para a indústria de conteúdo adulto",
    image: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    icon: "💼",
  },
];

export default function Page() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);

  return (
    <Container className="py-8 sm:py-12">
      {/* Hero Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-violet-400 to-pink-600 bg-clip-text text-transparent">EVO FILMS</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Sua porta de entrada para o cinema adulto profissional
          </p>
        </div>

        {/* Carousel */}
        <div className="relative w-full max-w-4xl mx-auto">
          <div className="relative h-96 rounded-3xl overflow-hidden bg-black/40">
            {/* Carousel Background */}
            <div
              className="absolute inset-0 transition-all duration-500"
              style={{ background: carouselItems[currentSlide].image }}
            />
            <div className="absolute inset-0 bg-black/30" />

            {/* Carousel Content */}
            <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="text-6xl mb-4">{carouselItems[currentSlide].icon}</div>
              <h2 className="text-4xl font-bold text-white mb-4">{carouselItems[currentSlide].title}</h2>
              <p className="text-lg text-white/90 max-w-xl">{carouselItems[currentSlide].desc}</p>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur p-3 rounded-full transition"
            >
              ←
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur p-3 rounded-full transition"
            >
              →
            </button>

            {/* Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {carouselItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2 h-2 rounded-full transition ${
                    idx === currentSlide ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/cadastro"
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-violet-500 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/50 transition"
          >
            🚀 Começar Cadastro
          </Link>
          <Link
            href="/painel"
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/20 text-white font-semibold rounded-xl hover:bg-white/5 transition"
          >
            📊 Acessar Painel
          </Link>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-16">
        <BenefitCard
          icon="✓"
          title="Cadastro Simples"
          desc="Processo online, rápido e totalmente anônimo"
        />
        <BenefitCard
          icon="🔐"
          title="Dados Protegidos"
          desc="Seus documentos salvos com segurança máxima"
        />
        <BenefitCard
          icon="📱"
          title="Tecnologia Moderna"
          desc="Reconhecimento facial avançado no seu navegador"
        />
        <BenefitCard
          icon="🎯"
          title="Oportunidade Real"
          desc="Entrada legítima para a indústria profissional"
        />
      </div>

      {/* Requirements Section */}
      <div className="mt-16 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Requisitos para Cadastro</h2>
        <ul className="space-y-3 text-white/80">
          <li className="flex gap-3">
            <span>✓</span>
            <span>Maior de 18 anos</span>
          </li>
          <li className="flex gap-3">
            <span>✓</span>
            <span>Documento oficial com foto (RG, CNH, Passaporte)</span>
          </li>
          <li className="flex gap-3">
            <span>✓</span>
            <span>Selfie com boa iluminação</span>
          </li>
          <li className="flex gap-3">
            <span>✓</span>
            <span>Consentimento para biometria e privacidade</span>
          </li>
        </ul>
      </div>
    </Container>
  );
}

function BenefitCard(props: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 hover:bg-white/10 transition">
      <div className="text-4xl mb-3">{props.icon}</div>
      <h3 className="font-semibold text-white mb-2">{props.title}</h3>
      <p className="text-sm text-white/70">{props.desc}</p>
    </div>
  );
}

