"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { claseInput } from "./ui";

interface Filtro {
  clave: string;
  etiqueta: string;
  opciones: Array<{ valor: string; texto: string }>;
}

/** Caja de búsqueda (tolerante a euskera en el servidor) + selects opcionales, todo en la URL. */
export function BuscadorSimple({ placeholder, filtros = [] }: { placeholder: string; filtros?: Filtro[] }) {
  const router = useRouter();
  const ruta = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  useEffect(() => {
    if (q === (sp.get("q") ?? "")) return;
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Buscar" className={`${claseInput} w-full sm:w-80`} />
      {filtros.map((f) => (
        <select key={f.clave} value={sp.get(f.clave) ?? ""} onChange={(e) => cambiar(f.clave, e.target.value)} aria-label={f.etiqueta} className={claseInput}>
          <option value="">{f.etiqueta}: todos</option>
          {f.opciones.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.texto}
            </option>
          ))}
        </select>
      ))}
      {[...sp.keys()].length > 0 && (
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
