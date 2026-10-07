"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { numero, type Parte } from "@/lib/tipos";
import { claseBotonPeligro, claseBotonPrimario, claseBotonSecundario, claseInput, Tarjeta } from "./ui";

/**
 * Validar / Corregir / Descartar (spec §2.5). "Corregir" abre los campos estructurados, guarda los
 * cambios y deja el parte en `corregido`. Todas guardan `revisado_por` y `revisado_at` en el servidor.
 */
export function AccionesParte({ parte }: { parte: Parte }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [d, setD] = useState({
    fecha_trabajo: parte.fecha_trabajo,
    operario_nombre: parte.operario_nombre ?? "",
    obra: parte.obra ?? "",
    partida: parte.partida ?? "",
    trabajo_realizado: parte.trabajo_realizado ?? "",
    cantidad: numero(parte.cantidad)?.toString() ?? "",
    unidad: parte.unidad ?? "",
    horas: numero(parte.horas)?.toString() ?? "",
    materiales: parte.materiales ?? "",
    incidencias: parte.incidencias ?? "",
  });

  async function enviar(cuerpo: Record<string, unknown>) {
    setError(null);
    const r = await fetch(`/api/partes/${parte.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error ?? `Error ${r.status}`);
      return;
    }
    setCorrigiendo(false);
    startTransition(() => router.refresh());
  }

  function guardarCorreccion(e: React.FormEvent) {
    e.preventDefault();
    enviar({
      estado: "corregido",
      fecha_trabajo: d.fecha_trabajo,
      operario_nombre: d.operario_nombre || null,
      obra: d.obra || null,
      partida: d.partida || null,
      trabajo_realizado: d.trabajo_realizado || null,
      cantidad: d.cantidad === "" ? null : Number(d.cantidad.replace(",", ".")),
      unidad: d.unidad || null,
      horas: d.horas === "" ? null : Number(d.horas.replace(",", ".")),
      materiales: d.materiales || null,
      incidencias: d.incidencias || null,
    });
  }

  const campo = (k: keyof typeof d) => ({
    value: d[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD((x) => ({ ...x, [k]: e.target.value })),
    className: `${claseInput} w-full`,
  });

  return (
    <div className="space-y-4">
      <Tarjeta className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-fj-text">Acciones</h2>
        <div className="flex flex-col gap-2">
          {parte.estado !== "validado" && (
            <button type="button" disabled={pendiente} onClick={() => enviar({ estado: "validado" })} className={claseBotonPrimario}>
              ✓ Validar
            </button>
          )}
          <button type="button" disabled={pendiente} onClick={() => setCorrigiendo((v) => !v)} className={claseBotonSecundario}>
            {corrigiendo ? "Cerrar corrección" : "Corregir"}
          </button>
          {parte.estado !== "descartado" ? (
            <button type="button" disabled={pendiente} onClick={() => enviar({ estado: "descartado" })} className={claseBotonPeligro}>
              Descartar
            </button>
          ) : (
            <button type="button" disabled={pendiente} onClick={() => enviar({ estado: "pendiente_revision" })} className={claseBotonSecundario}>
              Recuperar (volver a pendiente)
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-fj-danger">{error}</p>}
      </Tarjeta>

      <Tarjeta className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-fj-text">Datos del parte</h2>
        {corrigiendo ? (
          <form onSubmit={guardarCorreccion} className="flex flex-col gap-3 text-xs font-medium text-fj-muted">
            <label className="flex flex-col gap-1">
              Fecha del trabajo
              <input type="date" {...campo("fecha_trabajo")} />
            </label>
            <label className="flex flex-col gap-1">
              Operario
              <input {...campo("operario_nombre")} />
            </label>
            <label className="flex flex-col gap-1">
              Obra
              <input {...campo("obra")} />
            </label>
            <label className="flex flex-col gap-1">
              Partida
              <input {...campo("partida")} />
            </label>
            <label className="flex flex-col gap-1">
              Trabajo realizado
              <textarea rows={3} {...campo("trabajo_realizado")} />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex flex-col gap-1">
                Cantidad
                <input inputMode="decimal" {...campo("cantidad")} />
              </label>
              <label className="flex flex-col gap-1">
                Unidad
                <input placeholder="m, ud, ml…" {...campo("unidad")} />
              </label>
              <label className="flex flex-col gap-1">
                Horas
                <input inputMode="decimal" {...campo("horas")} />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              Materiales
              <textarea rows={2} {...campo("materiales")} />
            </label>
            <label className="flex flex-col gap-1">
              Incidencias
              <textarea rows={2} {...campo("incidencias")} />
            </label>
            <button type="submit" disabled={pendiente} className={claseBotonPrimario}>
              Guardar corrección
            </button>
          </form>
        ) : (
          <dl className="grid grid-cols-1 gap-y-3 text-sm">
            <Fila k="Trabajo realizado" v={parte.trabajo_realizado} />
            <Fila k="Cantidad" v={numero(parte.cantidad) !== null ? `${numero(parte.cantidad)} ${parte.unidad ?? ""}`.trim() : null} />
            <Fila k="Horas" v={numero(parte.horas)?.toString() ?? null} />
            <Fila k="Materiales" v={parte.materiales} />
            <Fila k="Incidencias" v={parte.incidencias} />
          </dl>
        )}
      </Tarjeta>
    </div>
  );
}

function Fila({ k, v }: { k: string; v: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-fj-faint">{k}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-fj-text">{v || <span className="text-fj-faint">—</span>}</dd>
    </div>
  );
}
