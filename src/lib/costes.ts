import { partesLocales } from "./fechas";
import { numero } from "./tipos";

/**
 * Gastos del agente (pantalla /gastos). Dos fuentes:
 *
 * 1. Llamadas de voz: Retell manda al colgar un bloque `cost` que n8n guarda en `fojansa_avisos.raw.cost`:
 *    `{ combined_cost, total_duration_seconds, total_duration_unit_price, product_costs: [{ product, cost, unit_price }] }`.
 *    Retell factura en **centavos de dólar**; n8n guarda `coste_eur = combined_cost / 100` sin cambio de
 *    divisa (1 USD = 1 EUR). Aquí se mantiene el mismo criterio para que cuadre con la bandeja.
 *
 * 2. Respuestas de IA (chat, partes...): filas de `fojansa_costes_ia` con tokens y coste por respuesta,
 *    que escribe el panel (`POST /api/costes`, o `/api/chat` si n8n devuelve `uso`) o n8n directamente.
 */

export interface ProductoCoste {
  producto: string;
  etiqueta: string;
  coste: number;
  unit_price: number | null;
}

export interface CosteLlamada {
  id: string;
  created_at: string;
  call_id: string | null;
  tipo: string | null;
  duracion_s: number | null;
  coste: number;
  /** €/min efectivo de la llamada. */
  costePorMinuto: number | null;
  productos: ProductoCoste[];
}

interface RawCost {
  combined_cost?: number;
  total_duration_seconds?: number;
  total_duration_unit_price?: number;
  product_costs?: Array<{ product?: string; cost?: number; unit_price?: number }>;
}

/** Nombres humanos de los productos que factura Retell. Lo desconocido se muestra tal cual. */
export function etiquetaProducto(producto: string): string {
  const p = producto.toLowerCase();
  if (p.includes("text_testing")) return "Pruebas de texto (GPT)";
  if (p.startsWith("retell_voice_engine")) return "Motor de voz (Retell)";
  if (p.includes("elevenlabs")) return "Voz sintética (ElevenLabs)";
  if (p.includes("cartesia")) return "Voz sintética (Cartesia)";
  if (p.startsWith("gpt") || p.includes("openai")) {
    // gpt_4_1 → GPT-4.1 · gpt_4o_mini → GPT-4o mini
    const nombre = producto.replace(/^gpt_/i, "GPT-").replace(/_(\d)/g, ".$1").replace(/_/g, " ");
    return `Modelo de lenguaje (${nombre})`;
  }
  if (p.includes("claude")) return "Modelo de lenguaje (Claude)";
  if (p.includes("gemini")) return "Modelo de lenguaje (Gemini)";
  if (p.includes("twilio") || p.includes("telephony") || p.includes("sip")) return "Telefonía";
  if (p.includes("knowledge")) return "Base de conocimiento";
  return producto.replace(/_/g, " ");
}

/** Extrae el desglose de una llamada. Si no hay `raw.cost`, usa `coste_eur` como único importe. */
export function costeDeAviso(a: {
  id: string;
  created_at: string;
  call_id: string | null;
  tipo: string | null;
  duracion_s: number | null;
  coste_eur: number | string | null;
  raw: unknown;
}): CosteLlamada {
  const raw = (a.raw && typeof a.raw === "object" ? (a.raw as { cost?: RawCost }).cost : undefined) ?? undefined;
  const coste = numero(a.coste_eur) ?? (raw?.combined_cost !== undefined ? raw.combined_cost / 100 : 0);
  const productos: ProductoCoste[] = (raw?.product_costs ?? [])
    .filter((p) => p.product && typeof p.cost === "number")
    .map((p) => ({
      producto: p.product!,
      etiqueta: etiquetaProducto(p.product!),
      coste: p.cost! / 100,
      unit_price: typeof p.unit_price === "number" ? p.unit_price / 100 : null,
    }));
  const duracion = a.duracion_s ?? raw?.total_duration_seconds ?? null;
  return {
    id: a.id,
    created_at: a.created_at,
    call_id: a.call_id,
    tipo: a.tipo,
    duracion_s: duracion,
    coste,
    costePorMinuto: duracion && duracion > 0 ? (coste / duracion) * 60 : null,
    productos,
  };
}

export interface CosteIa {
  id: string;
  created_at: string;
  canal: string;
  origen: string;
  session_id: string | null;
  aviso_id: string | null;
  proveedor: string | null;
  modelo: string | null;
  tokens_entrada: number | null;
  tokens_salida: number | null;
  coste_eur: number | string | null;
}

export interface ResumenGastos {
  llamadas: {
    n: number;
    coste: number;
    costeMedio: number | null;
    minutos: number;
    costePorMinuto: number | null;
    conDesglose: number;
    porProducto: Array<{ producto: string; etiqueta: string; coste: number; porcentaje: number }>;
    masCara: CosteLlamada | null;
  };
  ia: {
    n: number;
    coste: number;
    costeMedio: number | null;
    tokensEntrada: number;
    tokensSalida: number;
    porModelo: Array<{ modelo: string; n: number; coste: number; tokens: number }>;
    porOrigen: Array<{ origen: string; n: number; coste: number }>;
  };
  total: number;
  /** Serie diaria (clave YYYY-MM-DD en hora de Vitoria). */
  porDia: Array<{ dia: string; llamadas: number; voz: number; ia: number }>;
}

function claveDia(iso: string): string {
  const p = partesLocales(new Date(iso));
  return `${p.anio}-${String(p.mes).padStart(2, "0")}-${String(p.dia).padStart(2, "0")}`;
}

const r4 = (n: number) => Math.round(n * 10000) / 10000;

export function resumirGastos(llamadas: CosteLlamada[], ia: CosteIa[]): ResumenGastos {
  const porProducto = new Map<string, number>();
  const porDia = new Map<string, { llamadas: number; voz: number; ia: number }>();
  let costeVoz = 0;
  let segundos = 0;
  let conDesglose = 0;
  let masCara: CosteLlamada | null = null;

  const dia = (iso: string) => {
    const k = claveDia(iso);
    let d = porDia.get(k);
    if (!d) {
      d = { llamadas: 0, voz: 0, ia: 0 };
      porDia.set(k, d);
    }
    return d;
  };

  for (const l of llamadas) {
    costeVoz += l.coste;
    segundos += l.duracion_s ?? 0;
    if (l.productos.length > 0) conDesglose++;
    for (const p of l.productos) porProducto.set(p.producto, (porProducto.get(p.producto) ?? 0) + p.coste);
    if (!masCara || l.coste > masCara.coste) masCara = l;
    const d = dia(l.created_at);
    d.llamadas++;
    d.voz += l.coste;
  }

  const porModelo = new Map<string, { n: number; coste: number; tokens: number }>();
  const porOrigen = new Map<string, { n: number; coste: number }>();
  let costeIa = 0;
  let tokensEntrada = 0;
  let tokensSalida = 0;
  for (const c of ia) {
    const coste = numero(c.coste_eur) ?? 0;
    costeIa += coste;
    tokensEntrada += c.tokens_entrada ?? 0;
    tokensSalida += c.tokens_salida ?? 0;
    const m = c.modelo ?? "desconocido";
    const pm = porModelo.get(m) ?? { n: 0, coste: 0, tokens: 0 };
    pm.n++;
    pm.coste += coste;
    pm.tokens += (c.tokens_entrada ?? 0) + (c.tokens_salida ?? 0);
    porModelo.set(m, pm);
    const po = porOrigen.get(c.origen) ?? { n: 0, coste: 0 };
    po.n++;
    po.coste += coste;
    porOrigen.set(c.origen, po);
    dia(c.created_at).ia += coste;
  }

  const totalProductos = [...porProducto.values()].reduce((s, v) => s + v, 0);

  return {
    llamadas: {
      n: llamadas.length,
      coste: r4(costeVoz),
      costeMedio: llamadas.length ? costeVoz / llamadas.length : null,
      minutos: Math.round((segundos / 60) * 10) / 10,
      costePorMinuto: segundos > 0 ? (costeVoz / segundos) * 60 : null,
      conDesglose,
      porProducto: [...porProducto.entries()]
        .map(([producto, coste]) => ({
          producto,
          etiqueta: etiquetaProducto(producto),
          coste: r4(coste),
          porcentaje: totalProductos > 0 ? (coste / totalProductos) * 100 : 0,
        }))
        .sort((a, b) => b.coste - a.coste),
      masCara,
    },
    ia: {
      n: ia.length,
      coste: r4(costeIa),
      costeMedio: ia.length ? costeIa / ia.length : null,
      tokensEntrada,
      tokensSalida,
      porModelo: [...porModelo.entries()]
        .map(([modelo, v]) => ({ modelo, ...v, coste: r4(v.coste) }))
        .sort((a, b) => b.coste - a.coste),
      porOrigen: [...porOrigen.entries()]
        .map(([origen, v]) => ({ origen, ...v, coste: r4(v.coste) }))
        .sort((a, b) => b.coste - a.coste),
    },
    total: r4(costeVoz + costeIa),
    porDia: [...porDia.entries()]
      .map(([dia, v]) => ({ dia, llamadas: v.llamadas, voz: r4(v.voz), ia: r4(v.ia) }))
      .sort((a, b) => a.dia.localeCompare(b.dia)),
  };
}

/** Precios orientativos por millón de tokens (USD, oct-2026) para estimar el coste cuando n8n manda tokens pero no importe. */
export const PRECIO_POR_MILLON: Record<string, { entrada: number; salida: number }> = {
  "gpt-4.1": { entrada: 2, salida: 8 },
  "gpt-4.1-mini": { entrada: 0.4, salida: 1.6 },
  "gpt-4.1-nano": { entrada: 0.1, salida: 0.4 },
  "gpt-4o": { entrada: 2.5, salida: 10 },
  "gpt-4o-mini": { entrada: 0.15, salida: 0.6 },
  "gpt-5": { entrada: 1.25, salida: 10 },
  "gpt-5-mini": { entrada: 0.25, salida: 2 },
  "gpt-4o-transcribe": { entrada: 6, salida: 10 },
  "whisper-1": { entrada: 6, salida: 0 },
};

/** Estima el coste por tokens si se conoce el modelo. Devuelve null si no hay precio. */
export function estimarCoste(modelo: string | null | undefined, tokensEntrada: number | null, tokensSalida: number | null): number | null {
  if (!modelo) return null;
  // La coincidencia más larga gana: "gpt-4.1-mini-2025" es gpt-4.1-mini, no gpt-4.1.
  const clave = Object.keys(PRECIO_POR_MILLON)
    .filter((k) => modelo.toLowerCase().startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  if (!clave) return null;
  const p = PRECIO_POR_MILLON[clave];
  return ((tokensEntrada ?? 0) * p.entrada + (tokensSalida ?? 0) * p.salida) / 1_000_000;
}
