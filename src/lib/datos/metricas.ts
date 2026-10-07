import "server-only";
import { inicioDelDia, rangoPeriodo, sumarDias, type Periodo } from "../fechas";
import { calcularMetricas, resumenPartes, type AvisoMetrica, type Metricas, type ResumenPartes } from "../metricas";
import { supabaseAdmin, TABLAS } from "../supabase";

export interface MetricasPanel {
  periodo: Periodo;
  desde: string;
  hasta: string;
  metricas: Metricas;
  partesHoy: ResumenPartes;
}

export async function obtenerMetricas(periodo: Periodo, ahora = new Date()): Promise<MetricasPanel> {
  const { desde, hasta } = rangoPeriodo(periodo, ahora);
  const sb = supabaseAdmin();
  const hoy = inicioDelDia(ahora);
  const [avisos, partes] = await Promise.all([
    sb
      .from(TABLAS.avisos)
      .select("canal, tipo, urgente, datos_completos, estado, coste_eur, duracion_s, created_at")
      .gte("created_at", desde.toISOString())
      .lt("created_at", hasta.toISOString())
      .limit(5000),
    sb
      .from(TABLAS.partes)
      .select("estado")
      .gte("created_at", hoy.toISOString())
      .lt("created_at", sumarDias(hoy, 1).toISOString()),
  ]);
  if (avisos.error) throw new Error(`Métricas: ${avisos.error.message}`);
  if (partes.error) throw new Error(`Partes: ${partes.error.message}`);
  return {
    periodo,
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
    metricas: calcularMetricas(avisos.data as AvisoMetrica[]),
    partesHoy: resumenPartes(partes.data as Array<{ estado: string }>),
  };
}
