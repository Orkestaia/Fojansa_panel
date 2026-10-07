import { partesLocales } from "./fechas";
import { numero, TIPOS_AVISO, type Aviso, type TipoAviso } from "./tipos";

/**
 * Métricas de la pantalla de inicio (spec §2.1). Se calculan en memoria sobre los avisos del
 * periodo: el volumen (20-30 llamadas/día en invierno) no justifica agregados en SQL y así son
 * fáciles de probar. Los partes se cuentan aparte (`resumenPartes`).
 */

export type AvisoMetrica = Pick<
  Aviso,
  "canal" | "tipo" | "urgente" | "datos_completos" | "estado" | "coste_eur" | "duracion_s" | "created_at"
>;

export interface Metricas {
  total: number;
  porCanal: { voz: number; chat: number; otros: number };
  /** Avisos de verdad: se excluyen los silencios (spec agente §3.S: "no se cuenta como aviso"). */
  avisosReales: number;
  satisfactorios: number;
  porcentajeSatisfactorios: number | null;
  paraRevisar: number;
  urgentes: number;
  costeTotal: number;
  /** Media sobre las filas que tienen coste (las de voz). */
  costeMedio: number | null;
  duracionMedia: number | null;
  llamadasConCoste: number;
  porTipo: Array<{ tipo: TipoAviso | "sin_tipo"; n: number }>;
  /** 24 posiciones, hora local de Vitoria. */
  porHora: number[];
}

export function esChat(canal: Aviso["canal"]): boolean {
  return canal === "web" || canal === "whatsapp" || canal === "telegram";
}

export function esSatisfactorio(a: Pick<Aviso, "datos_completos" | "estado" | "tipo">): boolean {
  return a.datos_completos && a.estado !== "revisar" && a.tipo !== "silencio";
}

export function calcularMetricas(avisos: AvisoMetrica[]): Metricas {
  const porCanal = { voz: 0, chat: 0, otros: 0 };
  const porTipo = new Map<TipoAviso | "sin_tipo", number>();
  const porHora = new Array<number>(24).fill(0);
  let satisfactorios = 0;
  let paraRevisar = 0;
  let urgentes = 0;
  let costeTotal = 0;
  let llamadasConCoste = 0;
  let duracionTotal = 0;
  let conDuracion = 0;
  let avisosReales = 0;

  for (const a of avisos) {
    if (a.canal === "voz") porCanal.voz++;
    else if (esChat(a.canal)) porCanal.chat++;
    else porCanal.otros++;

    if (a.tipo !== "silencio") avisosReales++;
    if (esSatisfactorio(a)) satisfactorios++;
    if (a.estado === "revisar") paraRevisar++;
    if (a.urgente) urgentes++;

    const coste = numero(a.coste_eur);
    if (coste !== null) {
      costeTotal += coste;
      llamadasConCoste++;
    }
    if (a.duracion_s !== null && a.duracion_s !== undefined) {
      duracionTotal += a.duracion_s;
      conDuracion++;
    }

    const clave = a.tipo ?? "sin_tipo";
    porTipo.set(clave, (porTipo.get(clave) ?? 0) + 1);
    porHora[partesLocales(new Date(a.created_at)).hora]++;
  }

  const tipos: Array<TipoAviso | "sin_tipo"> = [...TIPOS_AVISO, "sin_tipo"];
  return {
    total: avisos.length,
    porCanal,
    avisosReales,
    satisfactorios,
    porcentajeSatisfactorios: avisosReales ? (satisfactorios / avisosReales) * 100 : null,
    paraRevisar,
    urgentes,
    costeTotal: Math.round(costeTotal * 10000) / 10000,
    costeMedio: llamadasConCoste ? costeTotal / llamadasConCoste : null,
    duracionMedia: conDuracion ? duracionTotal / conDuracion : null,
    llamadasConCoste,
    porTipo: tipos
      .map((tipo) => ({ tipo, n: porTipo.get(tipo) ?? 0 }))
      .filter((x) => x.n > 0 || x.tipo !== "sin_tipo"),
    porHora,
  };
}

export interface ResumenPartes {
  total: number;
  pendientes: number;
}

export function resumenPartes(partes: Array<{ estado: string }>): ResumenPartes {
  return {
    total: partes.length,
    pendientes: partes.filter((p) => p.estado === "pendiente_revision").length,
  };
}
