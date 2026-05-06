"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";

type FaceMatchResult = {
  distance: number;
  score: number;
  model: string;
  selfieDescriptor: number[];
  documentDescriptor: number[];
};

export function FaceMatchCheck(props: {
  documentFile: File | null;
  selfieFile: File | null;
  onResult: (result: FaceMatchResult | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<FaceMatchResult | null>(null);

  const run = useCallback(async () => {
    setMessage(null);
    setResult(null);
    props.onResult(null);

    if (!props.documentFile || !props.selfieFile) {
      setMessage("Envie o documento (frente) e capture a selfie para verificar.");
      return;
    }

    setLoading(true);
    try {
      const faceapi = await import("@vladmandic/face-api");

      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
      const docImg = await fileToImage(props.documentFile);
      const selfieImg = await fileToImage(props.selfieFile);

      const doc = await faceapi.detectSingleFace(docImg, opts).withFaceLandmarks(true).withFaceDescriptor();
      if (!doc) throw new Error("Não detectamos um rosto na foto do documento (frente).");

      const selfie = await faceapi.detectSingleFace(selfieImg, opts).withFaceLandmarks(true).withFaceDescriptor();
      if (!selfie) throw new Error("Não detectamos um rosto na selfie. Tente com melhor iluminação.");

      const distance = faceapi.euclideanDistance(doc.descriptor, selfie.descriptor);
      const threshold = 0.6;
      const score = clamp01(1 - distance / threshold);

      const r: FaceMatchResult = {
        distance,
        score,
        model: "face-api.js (tinyFaceDetector + faceRecognitionNet)",
        selfieDescriptor: Array.from(selfie.descriptor),
        documentDescriptor: Array.from(doc.descriptor),
      };

      setResult(r);
      props.onResult(r);
      setMessage(interpret(distance, score));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao verificar face.";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [props]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-white/90">Reconhecimento facial (selfie × documento)</div>
          <div className="mt-1 text-xs text-white/60">
            A checagem roda no seu navegador. Para publicar em produção, avalie um provedor de KYC/biometria.
          </div>
        </div>
        <Button type="button" onClick={run} disabled={loading}>
          {loading ? "Verificando..." : "Verificar"}
        </Button>
      </div>

      {message ? (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${result ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-black/30 text-white/80"}`}>
          {message}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 grid gap-3 text-xs text-white/70 sm:grid-cols-3">
          <Metric label="Distância" value={result.distance.toFixed(4)} />
          <Metric label="Score" value={`${Math.round(result.score * 100)}%`} />
          <Metric label="Modelo" value={result.model} />
        </div>
      ) : null}
    </div>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="text-white/55">{props.label}</div>
      <div className="mt-1 break-words font-mono text-white/85">{props.value}</div>
    </div>
  );
}

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Falha ao carregar imagem."));
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function interpret(distance: number, score: number): string {
  if (distance <= 0.45) return `Compatibilidade alta (distância ${distance.toFixed(3)} / score ${Math.round(score * 100)}%).`;
  if (distance <= 0.55) return `Compatibilidade média (distância ${distance.toFixed(3)} / score ${Math.round(score * 100)}%).`;
  return `Compatibilidade baixa (distância ${distance.toFixed(3)} / score ${Math.round(score * 100)}%). Verifique a qualidade das imagens.`;
}

