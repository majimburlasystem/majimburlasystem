"use client";

import { useEffect, useMemo } from "react";

export function FilePicker(props: {
  label: string;
  hint?: string;
  accept?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
}) {
  const url = useMemo(() => (props.file ? URL.createObjectURL(props.file) : null), [props.file]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-white/90">
            {props.label} {props.required ? <span className="text-rose-200">*</span> : null}
          </div>
          {props.hint ? <div className="mt-1 text-xs text-white/60">{props.hint}</div> : null}
        </div>
        <label className="cursor-pointer rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/90 hover:bg-white/10">
          Selecionar
          <input
            type="file"
            accept={props.accept ?? "image/*"}
            className="hidden"
            onChange={(e) => props.onChange(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {url ? (
        <div className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={props.label} className="aspect-[4/3] w-full rounded-xl object-cover" />
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-white/55">
            <span className="truncate">{props.file?.name}</span>
            <button
              type="button"
              onClick={() => props.onChange(null)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 text-xs text-white/55">Nenhum arquivo selecionado.</div>
      )}
    </div>
  );
}
