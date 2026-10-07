/**
 * Fechas en hora de Vitoria (Europe/Madrid), con el servidor en UTC (Vercel, Docker).
 * Todo lo que se agrupa "por día" u "por hora" pasa por aquí.
 */

export const ZONA = "Europe/Madrid";

export type Periodo = "hoy" | "7d" | "30d" | "temporada";

export const PERIODOS: Array<{ clave: Periodo; etiqueta: string }> = [
  { clave: "hoy", etiqueta: "Hoy" },
  { clave: "7d", etiqueta: "7 días" },
  { clave: "30d", etiqueta: "30 días" },
  { clave: "temporada", etiqueta: "Temporada" },
];

export function esPeriodo(v: unknown): v is Periodo {
  return typeof v === "string" && PERIODOS.some((p) => p.clave === v);
}

/** Partes de una fecha en la zona horaria dada. */
export function partesLocales(fecha: Date, zona = ZONA) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(f.formatToParts(fecha).map((x) => [x.type, x.value]));
  return {
    anio: Number(p.year),
    mes: Number(p.month),
    dia: Number(p.day),
    hora: Number(p.hour),
    minuto: Number(p.minute),
  };
}

/** Desfase (ms) entre UTC y la zona en un instante dado. */
function desfase(fecha: Date, zona: string): number {
  const p = partesLocales(fecha, zona);
  const comoUtc = Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto, fecha.getUTCSeconds());
  return comoUtc - (fecha.getTime() - fecha.getUTCMilliseconds());
}

/** Medianoche local (00:00 en la zona) de la fecha dada, como instante UTC. */
export function inicioDelDia(fecha: Date, zona = ZONA): Date {
  const p = partesLocales(fecha, zona);
  const aprox = new Date(Date.UTC(p.anio, p.mes - 1, p.dia, 0, 0, 0));
  // Ajustar por el desfase que haya a esa medianoche (cambia con el horario de verano).
  return new Date(aprox.getTime() - desfase(aprox, zona));
}

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * 86_400_000);
}

/**
 * Temporada de calefacción: del 1 de octubre al 30 de abril. Si estamos en mayo-septiembre se
 * toma la temporada que acaba de terminar, para que la tarjeta no salga vacía.
 */
export function inicioTemporada(ahora: Date, zona = ZONA): Date {
  const p = partesLocales(ahora, zona);
  const anio = p.mes >= 10 ? p.anio : p.anio - 1;
  const aprox = new Date(Date.UTC(anio, 9, 1, 0, 0, 0));
  return new Date(aprox.getTime() - desfase(aprox, zona));
}

/** Rango [desde, hasta) del periodo, en instantes UTC. */
export function rangoPeriodo(periodo: Periodo, ahora = new Date()): { desde: Date; hasta: Date } {
  const hoy = inicioDelDia(ahora);
  const manana = sumarDias(hoy, 1);
  switch (periodo) {
    case "hoy":
      return { desde: hoy, hasta: manana };
    case "7d":
      return { desde: sumarDias(hoy, -6), hasta: manana };
    case "30d":
      return { desde: sumarDias(hoy, -29), hasta: manana };
    case "temporada":
      return { desde: inicioTemporada(ahora), hasta: manana };
  }
}

const fmtFechaHora = new Intl.DateTimeFormat("es-ES", {
  timeZone: ZONA,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const fmtFecha = new Intl.DateTimeFormat("es-ES", {
  timeZone: ZONA,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const fmtHora = new Intl.DateTimeFormat("es-ES", {
  timeZone: ZONA,
  hour: "2-digit",
  minute: "2-digit",
});
const fmtCorta = new Intl.DateTimeFormat("es-ES", {
  timeZone: ZONA,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatearFechaHora(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  return fmtFechaHora.format(new Date(iso));
}
export function formatearFecha(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  // Las columnas `date` llegan como "2026-10-07": se interpretan como día local, no UTC.
  if (typeof iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [a, m, d] = iso.split("-");
    return `${d}/${m}/${a}`;
  }
  return fmtFecha.format(new Date(iso));
}
export function formatearHora(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  return fmtHora.format(new Date(iso));
}
export function formatearCorta(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  return fmtCorta.format(new Date(iso));
}

/** "hace 3 min", "hace 2 h", "ayer"... para la bandeja. */
export function haceCuanto(iso: string | Date, ahora = new Date()): string {
  const ms = ahora.getTime() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "ayer";
  return `hace ${d} días`;
}

export function formatearDuracion(segundos: number | null | undefined): string {
  if (segundos === null || segundos === undefined) return "—";
  const m = Math.floor(segundos / 60);
  const s = Math.round(segundos % 60);
  return m > 0 ? `${m} min ${s.toString().padStart(2, "0")} s` : `${s} s`;
}

const fmtEur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatearEuros(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const n = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(n)) return "—";
  return fmtEur.format(n);
}

export function formatearPorcentaje(valor: number | null): string {
  if (valor === null || !Number.isFinite(valor)) return "—";
  return `${Math.round(valor)} %`;
}
