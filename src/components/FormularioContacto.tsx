"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ETIQUETA_ESTADO_CONTACTO, ETIQUETA_TIPO_CLIENTE } from "@/lib/etiquetas";
import { ESTADOS_CONTACTO, TIPOS_CLIENTE, type Contacto, type EstadoContacto } from "@/lib/tipos";
import { claseBotonPrimario, claseInput, Tarjeta } from "./ui";

type Datos = Pick<
  Contacto,
  "nombre" | "telefono" | "direccion" | "piso" | "tipo_cliente" | "comunidad_id" | "contrato_mantenimiento" | "estado" | "canal_preferido" | "notas"
>;

/**
 * Datos editables del contacto (spec §2.3). Con `contacto` existente hace PATCH; sin él, POST
 * (alta manual). El estado derivado de la comunidad se enseña aparte: lo que se edita aquí es el
 * estado "a mano", que se respeta cuando la comunidad está al día.
 */
export function FormularioContacto({
  contacto,
  comunidades,
  estadoDerivado,
}: {
  contacto: (Datos & { id: string }) | null;
  comunidades: Array<{ id: string; texto: string }>;
  estadoDerivado: EstadoContacto | null;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [d, setD] = useState<Datos>({
    nombre: contacto?.nombre ?? "",
    telefono: contacto?.telefono ?? "",
    direccion: contacto?.direccion ?? "",
    piso: contacto?.piso ?? "",
    tipo_cliente: contacto?.tipo_cliente ?? "desconocido",
    comunidad_id: contacto?.comunidad_id ?? null,
    contrato_mantenimiento: contacto?.contrato_mantenimiento ?? null,
    estado: contacto?.estado ?? "desconocido",
    canal_preferido: contacto?.canal_preferido ?? "",
    notas: contacto?.notas ?? "",
  });

  function campo<K extends keyof Datos>(k: K, v: Datos[K]) {
    setD((x) => ({ ...x, [k]: v }));
    setGuardado(false);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cuerpo = {
      ...d,
      nombre: d.nombre || null,
      telefono: d.telefono || null,
      direccion: d.direccion || null,
      piso: d.piso || null,
      canal_preferido: d.canal_preferido || null,
      notas: d.notas || null,
    };
    const r = await fetch(contacto ? `/api/contactos/${contacto.id}` : "/api/contactos", {
      method: contacto ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(j.error ?? `Error ${r.status}`);
      return;
    }
    setGuardado(true);
    startTransition(() => {
      if (contacto) router.refresh();
      else router.push(`/contactos/${j.contacto.id}`);
    });
  }

  return (
    <Tarjeta className="p-5">
      <h2 className="mb-3 text-sm font-semibold text-fj-text">{contacto ? "Datos" : "Nuevo contacto"}</h2>
      <form onSubmit={guardar} className="flex flex-col gap-3">
        <Campo etiqueta="Nombre">
          <input value={d.nombre ?? ""} onChange={(e) => campo("nombre", e.target.value)} className={`${claseInput} w-full`} />
        </Campo>
        <Campo etiqueta="Teléfono">
          <input value={d.telefono ?? ""} onChange={(e) => campo("telefono", e.target.value)} inputMode="tel" className={`${claseInput} w-full tabular`} />
        </Campo>
        <div className="grid grid-cols-3 gap-2">
          <Campo etiqueta="Dirección" className="col-span-2">
            <input value={d.direccion ?? ""} onChange={(e) => campo("direccion", e.target.value)} className={`${claseInput} w-full`} />
          </Campo>
          <Campo etiqueta="Piso">
            <input value={d.piso ?? ""} onChange={(e) => campo("piso", e.target.value)} className={`${claseInput} w-full`} />
          </Campo>
        </div>
        <Campo etiqueta="Tipo">
          <select value={d.tipo_cliente ?? "desconocido"} onChange={(e) => campo("tipo_cliente", e.target.value as Datos["tipo_cliente"])} className={`${claseInput} w-full`}>
            {TIPOS_CLIENTE.map((t) => (
              <option key={t} value={t}>
                {ETIQUETA_TIPO_CLIENTE[t]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Comunidad">
          <select value={d.comunidad_id ?? ""} onChange={(e) => campo("comunidad_id", e.target.value || null)} className={`${claseInput} w-full`}>
            <option value="">Sin comunidad</option>
            {comunidades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.texto}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Contrato de mantenimiento">
          <select
            value={d.contrato_mantenimiento === null ? "" : d.contrato_mantenimiento ? "si" : "no"}
            onChange={(e) => campo("contrato_mantenimiento", e.target.value === "" ? null : e.target.value === "si")}
            className={`${claseInput} w-full`}
          >
            <option value="">No se sabe</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </Campo>
        <Campo etiqueta={estadoDerivado ? `Estado (a mano; la comunidad marca "${ETIQUETA_ESTADO_CONTACTO[estadoDerivado]}")` : "Estado"}>
          <select value={d.estado ?? "desconocido"} onChange={(e) => campo("estado", e.target.value as EstadoContacto)} className={`${claseInput} w-full`}>
            {ESTADOS_CONTACTO.map((s) => (
              <option key={s} value={s}>
                {ETIQUETA_ESTADO_CONTACTO[s]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Canal preferido">
          <select value={d.canal_preferido ?? ""} onChange={(e) => campo("canal_preferido", e.target.value)} className={`${claseInput} w-full`}>
            <option value="">—</option>
            <option value="voz">Voz</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="web">Chat</option>
            <option value="telegram">Telegram</option>
          </select>
        </Campo>
        <Campo etiqueta="Notas">
          <textarea value={d.notas ?? ""} onChange={(e) => campo("notas", e.target.value)} rows={4} className={`${claseInput} w-full`} />
        </Campo>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pendiente} className={claseBotonPrimario}>
            {contacto ? "Guardar cambios" : "Crear contacto"}
          </button>
          {guardado && <span className="text-sm text-fj-ok">Guardado ✓</span>}
          {error && <span className="text-sm text-fj-danger">{error}</span>}
        </div>
      </form>
    </Tarjeta>
  );
}

function Campo({ etiqueta, children, className = "" }: { etiqueta: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-medium text-fj-muted ${className}`}>
      {etiqueta}
      {children}
    </label>
  );
}
