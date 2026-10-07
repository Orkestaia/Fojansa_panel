import "server-only";
import { filtrarPorTexto } from "../euskera";
import { supabaseAdmin, TABLAS } from "../supabase";
import { numero, type EstadoParte, type Parte } from "../tipos";

export interface FiltrosPartes {
  obra?: string;
  estado?: EstadoParte;
  desde?: string; // YYYY-MM-DD (fecha_trabajo)
  hasta?: string;
  q?: string;
  limite?: number;
}

export async function listarPartes(f: FiltrosPartes = {}): Promise<Parte[]> {
  let q = supabaseAdmin()
    .from(TABLAS.partes)
    .select("*")
    .order("fecha_trabajo", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(f.limite ?? 500);
  if (f.obra) q = q.eq("obra", f.obra);
  if (f.estado) q = q.eq("estado", f.estado);
  if (f.desde) q = q.gte("fecha_trabajo", f.desde);
  if (f.hasta) q = q.lte("fecha_trabajo", f.hasta);
  const { data, error } = await q;
  if (error) throw new Error(`Partes: ${error.message}`);
  return filtrarPorTexto(data as Parte[], f.q, (p) => [
    p.operario_nombre,
    p.obra,
    p.partida,
    p.trabajo_realizado,
    p.transcripcion_es,
  ]);
}

export async function obtenerParte(id: string): Promise<Parte | null> {
  const { data, error } = await supabaseAdmin().from(TABLAS.partes).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Parte: ${error.message}`);
  return (data as Parte | null) ?? null;
}

export type CambiosParte = Partial<
  Pick<
    Parte,
    | "estado"
    | "revisado_por"
    | "revisado_at"
    | "obra"
    | "partida"
    | "trabajo_realizado"
    | "cantidad"
    | "unidad"
    | "horas"
    | "materiales"
    | "incidencias"
    | "operario_nombre"
    | "fecha_trabajo"
    | "motivo_revisar"
  >
>;

export async function actualizarParte(id: string, cambios: CambiosParte): Promise<Parte> {
  const { data, error } = await supabaseAdmin().from(TABLAS.partes).update(cambios).eq("id", id).select("*").single();
  if (error) throw new Error(`Actualizar parte: ${error.message}`);
  return data as Parte;
}

export interface ResumenObra {
  obra: string;
  partes: number;
  horas: number;
  /** Unidades acumuladas por unidad de medida ("m", "ud", "ml"...). */
  unidades: Array<{ unidad: string; cantidad: number }>;
  pendientes: number;
}

/** Resumen por obra: horas y unidades acumuladas (spec §2.5, base del cruce 360). Solo partes no descartados. */
export function resumirPorObra(partes: Parte[]): ResumenObra[] {
  const mapa = new Map<string, ResumenObra & { _u: Map<string, number> }>();
  for (const p of partes) {
    if (p.estado === "descartado") continue;
    const obra = p.obra?.trim() || "Sin obra";
    let r = mapa.get(obra);
    if (!r) {
      r = { obra, partes: 0, horas: 0, unidades: [], pendientes: 0, _u: new Map() };
      mapa.set(obra, r);
    }
    r.partes++;
    r.horas += numero(p.horas) ?? 0;
    if (p.estado === "pendiente_revision") r.pendientes++;
    const cantidad = numero(p.cantidad);
    if (cantidad !== null && cantidad > 0) {
      const u = p.unidad?.trim() || "ud";
      r._u.set(u, (r._u.get(u) ?? 0) + cantidad);
    }
  }
  return [...mapa.values()]
    .map(({ _u, ...r }) => ({
      ...r,
      horas: Math.round(r.horas * 100) / 100,
      unidades: [..._u.entries()].map(([unidad, cantidad]) => ({ unidad, cantidad: Math.round(cantidad * 100) / 100 })),
    }))
    .sort((a, b) => a.obra.localeCompare(b.obra, "es"));
}

export async function listarObras(): Promise<string[]> {
  const { data, error } = await supabaseAdmin().from(TABLAS.partes).select("obra").not("obra", "is", null);
  if (error) throw new Error(`Obras: ${error.message}`);
  return [...new Set((data as Array<{ obra: string }>).map((p) => p.obra.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}
