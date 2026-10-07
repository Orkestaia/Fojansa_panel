"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { claseBotonPrimario } from "./ui";

interface Resultado {
  creadas: number;
  actualizadas: number;
  descartadas: Array<{ fila: number; motivo: string }>;
  columnas: string[];
}

/** Importación CSV de comunidades (spec §2.4). El archivo se manda al servidor tal cual; allí se lee. */
export function ImportarCsv() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subir(archivo: File) {
    setCargando(true);
    setError(null);
    setResultado(null);
    const fd = new FormData();
    fd.append("archivo", archivo);
    const r = await fetch("/api/comunidades/importar", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    setCargando(false);
    if (!r.ok) {
      setError(j.error ?? `Error ${r.status}`);
      return;
    }
    setResultado(j);
    startTransition(() => router.refresh());
  }

  return (
    <div className="relative">
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) subir(f);
          e.target.value = "";
        }}
      />
      <button type="button" onClick={() => input.current?.click()} disabled={cargando} className={claseBotonPrimario}>
        {cargando ? "Importando…" : "Importar CSV"}
      </button>
      {(resultado || error) && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-fj-border bg-fj-surface p-4 text-sm shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-fj-text">Importación</p>
            <button
              type="button"
              onClick={() => {
                setResultado(null);
                setError(null);
              }}
              className="text-fj-faint hover:text-fj-text"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
          {error && <p className="mt-2 text-fj-danger">{error}</p>}
          {resultado && (
            <>
              <p className="mt-2 text-fj-text">
                {resultado.creadas} nuevas · {resultado.actualizadas} actualizadas
              </p>
              {resultado.descartadas.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-fj-warn">{resultado.descartadas.length} filas descartadas</summary>
                  <ul className="mt-1 max-h-40 list-inside list-disc overflow-auto text-xs text-fj-muted">
                    {resultado.descartadas.map((d) => (
                      <li key={d.fila}>
                        Fila {d.fila}: {d.motivo}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <p className="mt-2 text-xs text-fj-faint">Columnas: {resultado.columnas.join(", ")}</p>
            </>
          )}
          <p className="mt-3 text-xs text-fj-faint">
            Columnas mínimas: direccion, nombre, administrador, contrato_vigente, pagos_al_dia. Separador ; o , y sí/no.
          </p>
        </div>
      )}
    </div>
  );
}
