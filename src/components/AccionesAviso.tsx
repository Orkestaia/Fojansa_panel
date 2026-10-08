"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { EstadoAviso } from "@/lib/tipos";
import { claseBotonPrimario, claseBotonSecundario, claseInput, Tarjeta } from "./ui";

/**
 * Acciones del aviso (spec §2.2): "Pasado al programa", "Cerrar", "Marcar para revisar" con
 * motivo, "Abrir contacto" y "Copiar para Go!Manage". Todas llaman a PATCH /api/avisos/:id.
 */
export function AccionesAviso({
  id,
  estado,
  motivoRevisar,
  contactoId,
  derivadoA,
  textoGoManage,
}: {
  id: string;
  estado: EstadoAviso;
  motivoRevisar: string | null;
  contactoId: string | null;
  derivadoA: string | null;
  textoGoManage: string;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
  const [motivo, setMotivo] = useState(motivoRevisar ?? "");
  const [editandoDerivado, setEditandoDerivado] = useState(false);
  const [derivado, setDerivado] = useState(derivadoA ?? "");

  async function cambiar(cuerpo: Record<string, unknown>) {
    setError(null);
    const r = await fetch(`/api/avisos/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error ?? `Error ${r.status}`);
      return;
    }
    setPidiendoMotivo(false);
    setEditandoDerivado(false);
    startTransition(() => router.refresh());
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoGoManage);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError("No se ha podido copiar. Selecciona el texto de abajo y cópialo a mano.");
    }
  }

  const abierto = estado === "nuevo" || estado === "revisar";

  return (
    <>
      <Tarjeta className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-fj-text">Acciones</h2>
        <div className="flex flex-col gap-2">
          {estado !== "pasado_al_programa" && (
            <button type="button" disabled={pendiente} onClick={() => cambiar({ estado: "pasado_al_programa" })} className={claseBotonPrimario}>
              ✓ Pasado al programa
            </button>
          )}
          {estado === "pasado_al_programa" && (
            <button type="button" disabled={pendiente} onClick={() => cambiar({ estado: "nuevo" })} className={claseBotonSecundario}>
              Deshacer «pasado al programa»
            </button>
          )}
          {abierto && (
            <button type="button" disabled={pendiente} onClick={() => cambiar({ estado: "cerrado" })} className={claseBotonSecundario}>
              Cerrar
            </button>
          )}
          {estado === "cerrado" && (
            <button type="button" disabled={pendiente} onClick={() => cambiar({ estado: "nuevo" })} className={claseBotonSecundario}>
              Reabrir
            </button>
          )}
          {estado !== "revisar" ? (
            <button type="button" disabled={pendiente} onClick={() => setPidiendoMotivo((v) => !v)} className={claseBotonSecundario}>
              Marcar para revisar
            </button>
          ) : (
            <button type="button" disabled={pendiente} onClick={() => cambiar({ estado: "nuevo", motivo_revisar: null })} className={claseBotonSecundario}>
              Ya revisado (quitar marca)
            </button>
          )}
          {pidiendoMotivo && (
            <form
              className="flex flex-col gap-2 rounded-lg border border-fj-border bg-fj-surface-2 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (motivo.trim()) cambiar({ estado: "revisar", motivo_revisar: motivo.trim() });
              }}
            >
              <label className="text-xs font-medium text-fj-muted" htmlFor="motivo">
                Motivo
              </label>
              <input
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="p. ej. teléfono no coincide"
                className={claseInput}
                autoFocus
                required
              />
              <div className="flex gap-2">
                <button type="submit" disabled={pendiente || !motivo.trim()} className={claseBotonPrimario}>
                  Guardar
                </button>
                <button type="button" onClick={() => setPidiendoMotivo(false)} className={claseBotonSecundario}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
          {contactoId ? (
            <Link href={`/contactos/${contactoId}`} className={claseBotonSecundario}>
              Abrir contacto
            </Link>
          ) : (
            <button type="button" disabled className={claseBotonSecundario} title="Este aviso no tiene teléfono">
              Abrir contacto
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-fj-danger">{error}</p>}
      </Tarjeta>

      <Tarjeta className="p-5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-fj-text">Derivado a</h2>
          {!editandoDerivado && (
            <button type="button" onClick={() => setEditandoDerivado(true)} className="text-sm text-fj-navy underline-offset-2 hover:underline">
              {derivadoA ? "Cambiar" : "Anotar"}
            </button>
          )}
        </div>
        <p className="mb-2 text-xs text-fj-muted">Número o persona a la que el asistente pasó la llamada o el chat. Lo rellena el flujo al transferir, o la oficina a mano.</p>
        {editandoDerivado ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              cambiar({ derivado_a: derivado.trim() || null });
            }}
          >
            <input value={derivado} onChange={(e) => setDerivado(e.target.value)} placeholder="p. ej. Guardia · 600 000 000 o Guillermo" className={claseInput} autoFocus />
            <div className="flex gap-2">
              <button type="submit" disabled={pendiente} className={claseBotonPrimario}>
                Guardar
              </button>
              <button type="button" onClick={() => setEditandoDerivado(false)} className={claseBotonSecundario}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-fj-text">{derivadoA ?? <span className="text-fj-faint">No se derivó a nadie.</span>}</p>
        )}
      </Tarjeta>

      <Tarjeta className="p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-fj-text">Para Go!Manage</h2>
          <button type="button" onClick={copiar} className={copiado ? claseBotonPrimario : claseBotonSecundario} disabled={!textoGoManage}>
            {copiado ? "Copiado ✓" : "Copiar"}
          </button>
        </div>
        <p className="mb-2 text-xs text-fj-muted">Los campos en el orden en que se teclean en el programa.</p>
        <pre className="whitespace-pre-wrap rounded-lg bg-fj-surface-2 px-3 py-2 font-sans text-sm leading-relaxed text-fj-text">
          {textoGoManage || "Sin datos que copiar."}
        </pre>
      </Tarjeta>

      {estado === "pasado_al_programa" && (
        <p className="sr-only" aria-live="polite">
          Aviso pasado al programa
        </p>
      )}
    </>
  );
}
