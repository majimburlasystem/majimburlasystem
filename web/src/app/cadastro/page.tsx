"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Container } from "@/components/Container";
import { Steps } from "@/components/ui/Steps";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { FilePicker } from "@/components/FilePicker";
import { WebcamCapture } from "@/components/WebcamCapture";
import { FaceMatchCheck } from "@/components/FaceMatchCheck";
import { docTypes, performerTypes } from "@/lib/validation";

type FacePayload = {
  distance: number;
  score: number;
  model: string;
  selfieDescriptor: number[];
  documentDescriptor: number[];
};

type FormState = {
  performerType: (typeof performerTypes)[number];
  stageName: string;
  legalName: string;
  email: string;
  phone: string;
  birthDate: string;
  cpf: string;
  nationality: string;

  addressZip: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressCity: string;
  addressState: string;
  addressCountry: string;

  docType: (typeof docTypes)[number] | "";
  docNumber: string;
  docIssuer: string;

  consentIsAdult: boolean;
  consentPrivacy: boolean;
  consentBiometrics: boolean;
};

const steps = [
  { title: "Dados", desc: "Informações básicas" },
  { title: "Documentos", desc: "Fotos e dados" },
  { title: "Selfie", desc: "Câmera e checagem" },
  { title: "Envio", desc: "Consentimentos" },
] as const;

export default function CadastroPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [docFront, setDocFront] = useState<File | null>(null);
  const [docBack, setDocBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [face, setFace] = useState<FacePayload | null>(null);

  const [form, setForm] = useState<FormState>({
    performerType: "ATOR",
    stageName: "",
    legalName: "",
    email: "",
    phone: "",
    birthDate: "",
    cpf: "",
    nationality: "",

    addressZip: "",
    addressStreet: "",
    addressNumber: "",
    addressComplement: "",
    addressCity: "",
    addressState: "",
    addressCountry: "Brasil",

    docType: "RG",
    docNumber: "",
    docIssuer: "",

    consentIsAdult: false,
    consentPrivacy: false,
    consentBiometrics: false,
  });

  const canNext = useMemo(() => validateStep(step, form, { docFront, selfie }), [step, form, docFront, selfie]);

  const next = () => {
    setError(null);
    if (!canNext.ok) {
      setError(canNext.reason);
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prev = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    setError(null);
    const ok = validateStep(3, form, { docFront, selfie });
    if (!ok.ok) {
      setError(ok.reason);
      return;
    }
    if (!docFront || !selfie) {
      setError("Envie documento (frente) e selfie.");
      return;
    }

    const fd = new FormData();
    for (const [k, v] of Object.entries(form)) fd.append(k, String(v));
    fd.append("documentFront", docFront);
    if (docBack) fd.append("documentBack", docBack);
    fd.append("selfie", selfie);

    if (face) {
      fd.append("faceMatchDistance", String(face.distance));
      fd.append("faceMatchScore", String(face.score));
      fd.append("faceModel", face.model);
      fd.append("selfieDescriptorJson", JSON.stringify(face.selfieDescriptor));
      fd.append("documentDescriptorJson", JSON.stringify(face.documentDescriptor));
    }

    setBusy(true);
    try {
      const res = await fetch("/api/applications", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Falha ao enviar cadastro.");
      const token = String(json.accessToken ?? "");
      router.push(`/cadastro/sucesso?token=${encodeURIComponent(token)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Cadastro de Talentos</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            Processo completo com selfie, foto do documento e checagem de similaridade facial. Somente maiores de 18 anos.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Steps steps={[...steps]} activeIndex={step} />
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8">
          {step === 0 ? (
            <Card title="Dados do talento" subtitle="Use dados reais — necessário para compliance e validação.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tipo" required>
                  <Select value={form.performerType} onChange={(e) => setForm((s) => ({ ...s, performerType: e.target.value as FormState["performerType"] }))}>
                    {performerTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Data de nascimento" required>
                  <Input type="date" value={form.birthDate} onChange={(e) => setForm((s) => ({ ...s, birthDate: e.target.value }))} />
                </Field>
                <Field label="Nome artístico" required>
                  <Input value={form.stageName} onChange={(e) => setForm((s) => ({ ...s, stageName: e.target.value }))} placeholder="Ex: Nome Artístico" />
                </Field>
                <Field label="Nome civil (documento)" required>
                  <Input value={form.legalName} onChange={(e) => setForm((s) => ({ ...s, legalName: e.target.value }))} placeholder="Ex: Nome Completo" />
                </Field>
                <Field label="Email" required>
                  <Input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} placeholder="seu@email.com" />
                </Field>
                <Field label="Telefone">
                  <Input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} placeholder="+55 (11) 99999-9999" />
                </Field>
                <Field label="CPF">
                  <Input value={form.cpf} onChange={(e) => setForm((s) => ({ ...s, cpf: e.target.value }))} placeholder="000.000.000-00" />
                </Field>
                <Field label="Nacionalidade">
                  <Input value={form.nationality} onChange={(e) => setForm((s) => ({ ...s, nationality: e.target.value }))} placeholder="Brasileiro(a)" />
                </Field>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white mb-4">Endereço</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="CEP">
                    <Input value={form.addressZip} onChange={(e) => setForm((s) => ({ ...s, addressZip: e.target.value }))} placeholder="00000-000" />
                  </Field>
                  <Field label="Rua">
                    <Input value={form.addressStreet} onChange={(e) => setForm((s) => ({ ...s, addressStreet: e.target.value }))} placeholder="Nome da rua" />
                  </Field>
                  <Field label="Número">
                    <Input value={form.addressNumber} onChange={(e) => setForm((s) => ({ ...s, addressNumber: e.target.value }))} placeholder="123" />
                  </Field>
                  <Field label="Complemento">
                    <Input value={form.addressComplement} onChange={(e) => setForm((s) => ({ ...s, addressComplement: e.target.value }))} placeholder="Apto, sala..." />
                  </Field>
                  <Field label="Cidade">
                    <Input value={form.addressCity} onChange={(e) => setForm((s) => ({ ...s, addressCity: e.target.value }))} placeholder="São Paulo" />
                  </Field>
                  <Field label="Estado">
                    <Input value={form.addressState} onChange={(e) => setForm((s) => ({ ...s, addressState: e.target.value }))} placeholder="SP" />
                  </Field>
                </div>
              </div>
            </Card>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-6">
              <Card title="Documento" subtitle="Envie fotos legíveis. Preferencialmente sem reflexos e com boa iluminação.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Tipo de documento" required>
                    <Select value={form.docType} onChange={(e) => setForm((s) => ({ ...s, docType: e.target.value as FormState["docType"] }))}>
                      {docTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Número do documento">
                    <Input value={form.docNumber} onChange={(e) => setForm((s) => ({ ...s, docNumber: e.target.value }))} />
                  </Field>
                  <Field label="Órgão emissor">
                    <Input value={form.docIssuer} onChange={(e) => setForm((s) => ({ ...s, docIssuer: e.target.value }))} />
                  </Field>
                </div>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <FilePicker
                  label="Documento com foto (frente)"
                  required
                  hint="Ex: RG/CNH. Precisa aparecer o rosto."
                  file={docFront}
                  onChange={(f) => {
                    setDocFront(f);
                    setFace(null);
                  }}
                  accept="image/jpeg,image/png,image/webp"
                />
                <FilePicker
                  label="Documento (verso)"
                  hint="Opcional, mas recomendado."
                  file={docBack}
                  onChange={setDocBack}
                  accept="image/jpeg,image/png,image/webp"
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-6">
              <Card title="Selfie" subtitle="Capture com a câmera (ou envie uma foto). Olhe para a câmera e evite sombras.">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium text-white/70">Capturar com câmera</div>
                    <div className="mt-2">
                      <WebcamCapture
                        capturedFile={selfie}
                        onCapture={(file) => {
                          setSelfie(file);
                          setFace(null);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white/70">Ou enviar arquivo</div>
                    <div className="mt-2">
                      <FilePicker
                        label="Selfie (arquivo)"
                        hint="Se preferir, envie uma selfie (JPG/PNG/WebP)."
                        file={selfie}
                        onChange={(f) => {
                          setSelfie(f);
                          setFace(null);
                        }}
                        accept="image/jpeg,image/png,image/webp"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <FaceMatchCheck
                documentFile={docFront}
                selfieFile={selfie}
                onResult={(r) => setFace(r as FacePayload | null)}
              />
            </div>
          ) : null}

          {step === 3 ? (
            <Card title="Consentimentos e envio" subtitle="Obrigatório para processarmos seu cadastro com documentos e biometria.">
              <div className="space-y-4">
                <ConsentRow
                  checked={form.consentIsAdult}
                  onChange={(v) => setForm((s) => ({ ...s, consentIsAdult: v }))}
                  label="Confirmo que sou maior de 18 anos."
                />
                <ConsentRow
                  checked={form.consentPrivacy}
                  onChange={(v) => setForm((s) => ({ ...s, consentPrivacy: v }))}
                  label="Concordo com o tratamento dos meus dados pessoais (privacidade/LGPD)."
                />
                <ConsentRow
                  checked={form.consentBiometrics}
                  onChange={(v) => setForm((s) => ({ ...s, consentBiometrics: v }))}
                  label="Autorizo o uso de biometria facial para validação (selfie e documento)."
                />
              </div>

              <div className="mt-6">
                <Button type="button" onClick={submit} disabled={busy}>
                  {busy ? "Enviando..." : "Enviar cadastro"}
                </Button>
              </div>
            </Card>
          ) : null}
        </section>

        <aside className="lg:col-span-4">
          <div className="sticky top-6 space-y-4">
            <Card title="Navegação" subtitle="Volte e avance quando quiser.">
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={prev} disabled={step === 0 || busy}>
                  Voltar
                </Button>
                {step < steps.length - 1 ? (
                  <Button type="button" onClick={next} disabled={busy}>
                    Continuar
                  </Button>
                ) : null}
              </div>
              {!canNext.ok && step < steps.length - 1 ? (
                <div className="mt-3 text-xs text-white/55">Para continuar: {canNext.reason}</div>
              ) : null}
            </Card>
          </div>
        </aside>
      </div>
    </Container>
  );
}

function Field(props: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-white/70">
        {props.label} {props.required ? <span className="text-rose-200">*</span> : null}
      </div>
      <div className="mt-2">{props.children}</div>
    </label>
  );
}

function ConsentRow(props: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
      <Checkbox checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} />
      <span className="text-sm text-white/80">{props.label}</span>
    </label>
  );
}

function validateStep(step: number, form: FormState, files: { docFront: File | null; selfie: File | null }): { ok: boolean; reason: string } {
  if (step === 0) {
    if (form.stageName.trim().length < 2) return { ok: false, reason: "Informe o nome artístico." };
    if (form.legalName.trim().length < 2) return { ok: false, reason: "Informe o nome civil." };
    if (!form.email.includes("@")) return { ok: false, reason: "Informe um email válido." };
    if (!form.birthDate) return { ok: false, reason: "Informe a data de nascimento." };
    return { ok: true, reason: "" };
  }
  if (step === 1) {
    if (!files.docFront) return { ok: false, reason: "Envie o documento (frente)." };
    return { ok: true, reason: "" };
  }
  if (step === 2) {
    if (!files.selfie) return { ok: false, reason: "Capture/envie a selfie." };
    return { ok: true, reason: "" };
  }
  if (step === 3) {
    if (!files.docFront) return { ok: false, reason: "Envie o documento (frente)." };
    if (!files.selfie) return { ok: false, reason: "Capture/envie a selfie." };
    if (!form.consentIsAdult) return { ok: false, reason: "Confirme que é maior de 18." };
    if (!form.consentPrivacy) return { ok: false, reason: "Aceite privacidade/LGPD." };
    if (!form.consentBiometrics) return { ok: false, reason: "Aceite biometria facial." };
    return { ok: true, reason: "" };
  }
  return { ok: true, reason: "" };
}
