import "server-only";
import { costeDeAviso, estimarCoste, resumirGastos, type CosteIa, type CosteLlamada, type ResumenGastos } from "../costes";
import { rangoPeriodo, type Periodo } from "../fechas";
import { supabaseAdmin, TABLAS } from "../supabase";

export interface GastosPanel {
  periodo: Periodo;
  desde: string;
  hasta: string;
  resumen: ResumenGastos;
  llamadas: CosteLlamada[];
  ia: CosteIa[];
}

export async function obtenerGastos(periodo: Periodo, ahora = new Date()): Promise<GastosPanel> {
  const { desde, hasta } = rangoPeriodo(periodo, ahora);
  const sb = supabaseAdmin();
  const [avisos, costes] = await Promise.all([
    sb
      .from(TABLAS.avisos)
      .select("id, created_at, call_id, tipo, duracion_s, coste_eur, raw")
      .eq("canal", "voz")
      .gte("created_at", desde.toISOString())
      .lt("created_at", hasta.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000),
    sb
      .from(TABLAS.costesIa)
      .select("id, created_at, canal, origen, session_id, aviso_id, proveedor, modelo, tokens_entrada, tokens_salida, coste_eur")
      .gte("created_at", desde.toISOString())
      .lt("created_at", hasta.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);
  if (avisos.error) throw new Error(`Gastos (llamadas): ${avisos.error.message}`);
  if (costes.error) throw new Error(`Gastos (IA): ${costes.error.message}`);
  const llamadas = (avisos.data as Parameters<typeof costeDeAviso>[0][]).map(costeDeAviso);
  const ia = costes.data as CosteIa[];
  return { periodo, desde: desde.toISOString(), hasta: hasta.toISOString(), resumen: resumirGastos(llamadas, ia), llamadas, ia };
}

export interface NuevoCosteIa {
  canal?: string;
  origen?: string;
  session_id?: string | null;
  aviso_id?: string | null;
  proveedor?: string | null;
  modelo?: string | null;
  tokens_entrada?: number | null;
  tokens_salida?: number | null;
  coste_eur?: number | null;
  raw?: unknown;
}

/** Guarda una respuesta de IA. Si no trae importe pero sí modelo y tokens, lo estima con la tabla de precios. */
export async function registrarCosteIa(c: NuevoCosteIa): Promise<CosteIa> {
  const coste = c.coste_eur ?? estimarCoste(c.modelo, c.tokens_entrada ?? null, c.tokens_salida ?? null);
  const { data, error } = await supabaseAdmin()
    .from(TABLAS.costesIa)
    .insert({
      canal: c.canal ?? "web",
      origen: c.origen ?? "chat",
      session_id: c.session_id ?? null,
      aviso_id: c.aviso_id ?? null,
      proveedor: c.proveedor ?? null,
      modelo: c.modelo ?? null,
      tokens_entrada: c.tokens_entrada ?? null,
      tokens_salida: c.tokens_salida ?? null,
      coste_eur: coste,
      raw: c.raw ?? null,
    })
    .select("id, created_at, canal, origen, session_id, aviso_id, proveedor, modelo, tokens_entrada, tokens_salida, coste_eur")
    .single();
  if (error) throw new Error(`Registrar coste IA: ${error.message}`);
  return data as CosteIa;
}
