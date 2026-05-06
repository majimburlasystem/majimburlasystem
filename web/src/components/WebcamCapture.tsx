"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  onCapture: (file: File | null) => void;
  capturedFile?: File | null;
};

export function WebcamCapture(props: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasCapture = Boolean(props.capturedFile);
  const capturedUrl = useMemo(() => (props.capturedFile ? URL.createObjectURL(props.capturedFile) : null), [props.capturedFile]);

  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

  useEffect(() => {
    if (hasCapture) return;
    let mounted = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (!mounted) return;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch (e) {
        setError("Não foi possível acessar a câmera. Verifique permissões do navegador.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [hasCapture]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const capture = async () => {
    setError(null);
    const video = videoRef.current;
    if (!video) return;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) return;

    const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: "image/jpeg" });
    props.onCapture(file);
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      {error ? <div className="mb-3 text-sm text-rose-200">{error}</div> : null}

      {hasCapture && capturedUrl ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={capturedUrl} alt="Selfie capturada" className="aspect-video w-full rounded-xl object-cover" />
          <div className="mt-3 flex gap-3">
            <Button type="button" variant="secondary" onClick={() => props.onCapture(null)}>
              Refazer
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <video ref={videoRef} playsInline muted className="aspect-video w-full rounded-xl bg-black/50 object-cover" />
          <div className="mt-3 flex gap-3">
            <Button type="button" onClick={capture}>
              Capturar selfie
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
