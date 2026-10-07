"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ETIQUETA_ESTADO_AVISO, ETIQUETA_TIPO } from "@/lib/etiquetas";
import { ESTADOS_AVISO, TIPOS_AVISO } from "@/lib/tipos";
import { claseInput } from "./ui";

/** Filtros de la bandeja (spec §2.2). Viven en la URL para que el enlace sea compartible. */
export function FiltrosBandeja() {
  const router = useRouter();
  const ruta = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  // Texto libre con un pequeño retardo para no pedir en cada tecla.
  useEffect(() => {
    const actual = sp.get("q") ?? "";
    if (q === actual) return;
    const id = setTimeout(() => cambiar("q", q), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function cambiar(clave: string, valor: string) {
    const p = new URLSearchParams(sp.toString());
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    router.replace(`${ruta}${p.toString() ? `?${p}` : ""}`);
  }

  const hayFiltros = [...sp.keys()].length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar dirección, nombre, teléfono… (vale Goicoechea por Goikoetxea)"
        aria-label="Buscar"
        className={`${claseInput} w-full sm:w-80`}
      />
      <select value={sp.get("estado") ?? ""} onChange={(e) => cambiar("estado", e.target.value)} aria-label="Estado" className={claseInput}>
        <option value="">Todos los estados</option>
        <option value="abiertos">Abiertos (nuevo + revisar)</option>
        {ESTADOS_AVISO.map((e) => (
          <option key={e} value={e}>
            {ETIQUETA_ESTADO_AVISO[e]}
          </option>
        ))}
      </select>
      <select value={sp.get("canal") ?? ""} onChange={(e) => cambiar("canal", e.target.value)} aria-label="Canal" className={claseInput}>
        <option value="">Voz y chat</option>
        <option value="voz">Voz</option>
        <option value="chat">Chat</option>
      </select>
      <select value={sp.get("tipo") ?? ""} onChange={(e) => cambiar("tipo", e.target.value)} aria-label="Tipo" className={claseInput}>
        <option value="">Todos los tipos</option>
        {TIPOS_AVISO.map((t) => (
          <option key={t} value={t}>
            {ETIQUETA_TIPO[t]}
          </option>
        ))}
      </select>
      <label className="inline-flex items-center gap-1.5 text-sm text-fj-text">
        <input
          type="checkbox"
          checked={sp.get("urgente") === "1"}
          onChange={(e) => cambiar("urgente", e.target.checked ? "1" : "")}
          className="h-4 w-4 accent-fj-navy"
        />
        Solo urgentes
      </label>
      <label className="inline-flex items-center gap-1.5 text-sm text-fj-muted">
        Desde
        <input type="date" value={sp.get("desde") ?? ""} onChange={(e) => cambiar("desde", e.target.value)} className={claseInput} />
      </label>
      <label className="inline-flex items-center gap-1.5 text-sm text-fj-muted">
        Hasta
        <input type="date" value={sp.get("hasta") ?? ""} onChange={(e) => cambiar("hasta", e.target.value)} className={claseInput} />
      </label>
      {hayFiltros && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.replace(ruta);
          }}
          className="text-sm text-fj-navy underline-offset-2 hover:underline"
        >
          Quitar filtros
        </button>
      )}
    </div>
  );
}
