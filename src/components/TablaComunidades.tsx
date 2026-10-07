"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ComunidadConResumen } from "@/lib/datos/comunidades";
import { claseBotonPrimario, claseBotonSecundario, claseInput, Tarjeta, Vacio } from "./ui";

type Editable = Pick<ComunidadConResumen, "nombre" | "direccion" | "administrador" | "contrato_vigente" | "pagos_al_dia" | "tipo_instalacion">;

/** Tabla de comunidades con edición inline (spec §2.4) y alta de una comunidad nueva. */
export function TablaComunidades({ comunidades }: { comunidades: ComunidadConResumen[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editando, setEditando] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<Editable | null>(null);
  const [nueva, setNueva] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function empezar(c: ComunidadConResumen) {
    setEditando(c.id);
    setNueva(false);
    setBorrador({
      nombre: c.nombre,
      direccion: c.direccion,
      administrador: c.administrador,
      contrato_vigente: c.contrato_vigente,
      pagos_al_dia: c.pagos_al_dia,
      tipo_instalacion: c.tipo_instalacion,
    });
    setError(null);
  }

  function empezarNueva() {
    setNueva(true);
    setEditando(null);
    setBorrador({ nombre: "", direccion: "", administrador: "", contrato_vigente: true, pagos_al_dia: true, tipo_instalacion: "" });
    setError(null);
  }

  async function guardar() {
    if (!borrador) return;
    if (!borrador.direccion?.trim()) {
      setError("La dirección es obligatoria");
      return;
    }
    setGuardando(true);
    setError(null);
    const cuerpo = {
      ...borrador,
      nombre: borrador.nombre?.trim() || null,
      administrador: borrador.administrador?.trim() || null,
      tipo_instalacion: borrador.tipo_instalacion?.trim() || null,
      direccion: borrador.direccion.trim(),
    };
    const r = await fetch(nueva ? "/api/comunidades" : `/api/comunidades/${editando}`, {
      method: nueva ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    setGuardando(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error ?? `Error ${r.status}`);
      return;
    }
    setEditando(null);
    setNueva(false);
    setBorrador(null);
    startTransition(() => router.refresh());
  }

  function cancelar() {
    setEditando(null);
    setNueva(false);
    setBorrador(null);
    setError(null);
  }

  const filaEdicion = (
    <tr className="bg-fj-navy-soft/40">
      <td className="px-4 py-2">
        <input value={borrador?.direccion ?? ""} onChange={(e) => setBorrador((b) => b && { ...b, direccion: e.target.value })} placeholder="Calle y número" className={`${claseInput} w-full`} autoFocus />
      </td>
      <td className="px-3 py-2">
        <input value={borrador?.nombre ?? ""} onChange={(e) => setBorrador((b) => b && { ...b, nombre: e.target.value })} placeholder="Nombre" className={`${claseInput} w-full`} />
      </td>
      <td className="px-3 py-2">
        <input value={borrador?.administrador ?? ""} onChange={(e) => setBorrador((b) => b && { ...b, administrador: e.target.value })} placeholder="Administrador" className={`${claseInput} w-full`} />
      </td>
      <td className="px-3 py-2">
        <input value={borrador?.tipo_instalacion ?? ""} onChange={(e) => setBorrador((b) => b && { ...b, tipo_instalacion: e.target.value })} placeholder="Instalación" className={`${claseInput} w-full`} />
      </td>
      <td className="px-3 py-2 text-center">
        <input type="checkbox" checked={borrador?.contrato_vigente ?? true} onChange={(e) => setBorrador((b) => b && { ...b, contrato_vigente: e.target.checked })} className="h-4 w-4 accent-fj-navy" aria-label="Contrato vigente" />
      </td>
      <td className="px-3 py-2 text-center">
        <input type="checkbox" checked={borrador?.pagos_al_dia ?? true} onChange={(e) => setBorrador((b) => b && { ...b, pagos_al_dia: e.target.checked })} className="h-4 w-4 accent-fj-navy" aria-label="Pagos al día" />
      </td>
      <td className="px-3 py-2 text-right text-fj-faint">—</td>
      <td className="px-4 py-2">
        <div className="flex justify-end gap-1">
          <button type="button" onClick={guardar} disabled={guardando} className={claseBotonPrimario}>
            Guardar
          </button>
          <button type="button" onClick={cancelar} className={claseBotonSecundario}>
            Cancelar
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <Tarjeta className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-fj-border px-4 py-2.5">
        <p className="text-sm text-fj-muted">
          {comunidades.length} {comunidades.length === 1 ? "comunidad" : "comunidades"}. Pulsa una fila para editarla.
        </p>
        <button type="button" onClick={empezarNueva} className={claseBotonSecundario} disabled={nueva}>
          + Añadir comunidad
        </button>
      </div>
      {error && <p className="px-4 pt-3 text-sm text-fj-danger">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-fj-surface-2 text-left text-xs font-medium uppercase tracking-wide text-fj-faint">
            <tr>
              <th className="px-4 py-2.5">Dirección</th>
              <th className="px-3 py-2.5">Nombre</th>
              <th className="px-3 py-2.5">Administrador</th>
              <th className="px-3 py-2.5">Instalación</th>
              <th className="px-3 py-2.5 text-center">Contrato vigente</th>
              <th className="px-3 py-2.5 text-center">Pagos al día</th>
              <th className="px-3 py-2.5 text-right">Avisos</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fj-border">
            {nueva && filaEdicion}
            {comunidades.length === 0 && !nueva && (
              <tr>
                <td colSpan={8} className="p-6">
                  <Vacio>No hay comunidades. Importa el CSV de Go!Manage o añade una a mano.</Vacio>
                </td>
              </tr>
            )}
            {comunidades.map((c) =>
              editando === c.id ? (
                <FilaEditable key={c.id}>{filaEdicion}</FilaEditable>
              ) : (
                <tr key={c.id} onClick={() => empezar(c)} className="cursor-pointer hover:bg-fj-surface-2">
                  <td className="px-4 py-2.5 font-medium text-fj-text">{c.direccion}</td>
                  <td className="px-3 py-2.5 text-fj-text">{c.nombre ?? <span className="text-fj-faint">—</span>}</td>
                  <td className="px-3 py-2.5 text-fj-muted">{c.administrador ?? "—"}</td>
                  <td className="px-3 py-2.5 text-fj-muted">{c.tipo_instalacion ?? "—"}</td>
                  <td className="px-3 py-2.5 text-center">{c.contrato_vigente ? <span className="text-fj-ok">Sí</span> : <span className="font-medium text-fj-warn">No</span>}</td>
                  <td className="px-3 py-2.5 text-center">{c.pagos_al_dia ? <span className="text-fj-ok">Sí</span> : <span className="font-medium text-fj-danger">No</span>}</td>
                  <td className="tabular px-3 py-2.5 text-right">
                    {c.n_avisos > 0 ? (
                      <Link href={`/avisos?q=${encodeURIComponent(c.direccion)}`} onClick={(e) => e.stopPropagation()} className="text-fj-navy hover:underline">
                        {c.n_avisos}
                      </Link>
                    ) : (
                      <span className="text-fj-faint">0</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-fj-faint">Editar</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </Tarjeta>
  );
}

function FilaEditable({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
