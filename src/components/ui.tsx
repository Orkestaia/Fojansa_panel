import Link from "next/link";
import type { ReactNode } from "react";
import {
  ETIQUETA_CANAL,
  ETIQUETA_ESTADO_AVISO,
  ETIQUETA_ESTADO_CONTACTO,
  ETIQUETA_ESTADO_PARTE,
  ETIQUETA_TIPO,
} from "@/lib/etiquetas";
import type { CanalAviso, CanalParte, EstadoAviso, EstadoContacto, EstadoParte, TipoAviso } from "@/lib/tipos";

/** Piezas de interfaz compartidas. Sin color hardcodeado: todo son tokens de globals.css. */

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-fj-border bg-fj-surface shadow-[0_1px_2px_rgba(0,46,98,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function Titulo({ children, sub, acciones }: { children: ReactNode; sub?: ReactNode; acciones?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fj-navy">{children}</h1>
        {sub && <p className="mt-1 text-sm text-fj-muted">{sub}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  );
}

type Tono = "neutro" | "navy" | "ok" | "warn" | "danger" | "info";

const TONOS: Record<Tono, string> = {
  neutro: "bg-fj-surface-2 text-fj-muted border-fj-border",
  navy: "bg-fj-navy-soft text-fj-navy border-transparent",
  ok: "bg-fj-ok-soft text-fj-ok border-transparent",
  warn: "bg-fj-warn-soft text-fj-warn border-transparent",
  danger: "bg-fj-danger-soft text-fj-danger border-transparent",
  info: "bg-fj-info-soft text-fj-info border-transparent",
};

export function Insignia({ tono = "neutro", children, title }: { tono?: Tono; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${TONOS[tono]}`}
    >
      {children}
    </span>
  );
}

export function InsigniaEstadoAviso({ estado }: { estado: EstadoAviso }) {
  const tono: Tono = estado === "revisar" ? "warn" : estado === "pasado_al_programa" ? "ok" : estado === "cerrado" ? "neutro" : "info";
  return <Insignia tono={tono}>{ETIQUETA_ESTADO_AVISO[estado] ?? estado}</Insignia>;
}

export function InsigniaTipo({ tipo }: { tipo: TipoAviso | null }) {
  if (!tipo) return <Insignia>Sin tipo</Insignia>;
  const tono: Tono = tipo === "urgencia" ? "danger" : tipo === "silencio" || tipo === "persona" ? "neutro" : "navy";
  return <Insignia tono={tono}>{ETIQUETA_TIPO[tipo] ?? tipo}</Insignia>;
}

export function InsigniaEstadoContacto({ estado }: { estado: EstadoContacto }) {
  const tono: Tono =
    estado === "activo" ? "ok" : estado === "pago_pendiente" ? "danger" : estado === "sin_contrato" || estado === "revisar" ? "warn" : "neutro";
  return <Insignia tono={tono}>{ETIQUETA_ESTADO_CONTACTO[estado] ?? estado}</Insignia>;
}

export function InsigniaEstadoParte({ estado }: { estado: EstadoParte }) {
  const tono: Tono = estado === "validado" ? "ok" : estado === "corregido" ? "info" : estado === "descartado" ? "neutro" : "warn";
  return <Insignia tono={tono}>{ETIQUETA_ESTADO_PARTE[estado] ?? estado}</Insignia>;
}

/** Icono del canal (spec §2.2: "canal (icono)"). SVG inline, sin librería. */
export function IconoCanal({ canal, className = "h-4 w-4" }: { canal: CanalAviso | CanalParte; className?: string }) {
  const titulo = ETIQUETA_CANAL[canal] ?? canal;
  if (canal === "voz") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-label={titulo}>
        <title>{titulo}</title>
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
      </svg>
    );
  }
  if (canal === "manual") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-label={titulo}>
        <title>{titulo}</title>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-label={titulo}>
      <title>{titulo}</title>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 3 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 9 8.4z" />
    </svg>
  );
}

export function Canal({ canal }: { canal: CanalAviso | CanalParte }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-fj-text">
      <IconoCanal canal={canal} className="h-4 w-4 text-fj-navy" />
      {ETIQUETA_CANAL[canal] ?? canal}
    </span>
  );
}

export function Vacio({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-fj-border-hi p-10 text-center text-sm text-fj-muted">{children}</div>;
}

export function BotonEnlace({ href, children, primario = false }: { href: string; children: ReactNode; primario?: boolean }) {
  return (
    <Link
      href={href}
      className={
        primario
          ? "inline-flex items-center rounded-lg bg-fj-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-fj-navy-hi"
          : "inline-flex items-center rounded-lg border border-fj-border bg-fj-surface px-3 py-1.5 text-sm font-medium text-fj-navy hover:border-fj-border-hi"
      }
    >
      {children}
    </Link>
  );
}

/** Par etiqueta/valor para las fichas de detalle. */
export function Dato({ etiqueta, children, ancho = false }: { etiqueta: string; children: ReactNode; ancho?: boolean }) {
  return (
    <div className={ancho ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-medium uppercase tracking-wide text-fj-faint">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-fj-text">{children ?? "—"}</dd>
    </div>
  );
}

export const claseInput =
  "rounded-lg border border-fj-border bg-fj-surface px-3 py-1.5 text-sm text-fj-text placeholder:text-fj-faint focus:border-fj-navy focus:outline-none focus:ring-2 focus:ring-fj-navy/15";
export const claseBotonPrimario =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-fj-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-fj-navy-hi disabled:cursor-not-allowed disabled:opacity-50";
export const claseBotonSecundario =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-fj-border bg-fj-surface px-3 py-1.5 text-sm font-medium text-fj-navy hover:border-fj-border-hi disabled:cursor-not-allowed disabled:opacity-50";
export const claseBotonPeligro =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-fj-danger/30 bg-fj-surface px-3 py-1.5 text-sm font-medium text-fj-danger hover:bg-fj-danger-soft disabled:cursor-not-allowed disabled:opacity-50";
