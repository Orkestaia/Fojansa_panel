import { describe, expect, it } from "vitest";
import { costeDeAviso, estimarCoste, etiquetaProducto, resumirGastos, type CosteIa } from "./costes";

const rawRetell = {
  cost: {
    combined_cost: 32.7666756,
    product_costs: [
      { cost: 12.2833378, product: "retell_voice_engine", unit_price: 0.0916667 },
      { cost: 8.9333378, product: "elevenlabs_tts_03_2026", unit_price: 0.0666667 },
      { cost: 10.05, product: "gpt_4_1", unit_price: 0.075 },
      { cost: 1.5, product: "gpt_4_1_text_testing", unit_price: 1.5 },
    ],
    total_duration_seconds: 134,
    total_duration_unit_price: 0.2333334,
  },
  analysis: {},
};

describe("etiquetaProducto", () => {
  it("traduce los productos de Retell", () => {
    expect(etiquetaProducto("retell_voice_engine")).toBe("Motor de voz (Retell)");
    expect(etiquetaProducto("elevenlabs_tts_03_2026")).toBe("Voz sintética (ElevenLabs)");
    expect(etiquetaProducto("gpt_4_1")).toBe("Modelo de lenguaje (GPT-4.1)");
    expect(etiquetaProducto("gpt_4o_mini")).toBe("Modelo de lenguaje (GPT-4o mini)");
    expect(etiquetaProducto("gpt_4_1_text_testing")).toBe("Pruebas de texto (GPT)");
    expect(etiquetaProducto("algo_raro")).toBe("algo raro");
  });
});

describe("costeDeAviso", () => {
  it("convierte los centavos de Retell y calcula €/min", () => {
    const c = costeDeAviso({
      id: "a",
      created_at: "2026-10-07T16:33:39Z",
      call_id: "call_1",
      tipo: "averia_comunidad",
      duracion_s: 134,
      coste_eur: "0.3277",
      raw: rawRetell,
    });
    expect(c.coste).toBeCloseTo(0.3277, 4);
    expect(c.productos).toHaveLength(4);
    expect(c.productos[0]).toMatchObject({ producto: "retell_voice_engine", etiqueta: "Motor de voz (Retell)" });
    expect(c.productos[0].coste).toBeCloseTo(0.1228, 4);
    expect(c.costePorMinuto).toBeCloseTo(0.1467, 3);
  });
  it("sin raw.cost usa coste_eur y sin coste_eur usa combined_cost/100", () => {
    const sinRaw = costeDeAviso({ id: "b", created_at: "2026-10-07T10:00:00Z", call_id: null, tipo: null, duracion_s: 60, coste_eur: 0.2, raw: null });
    expect(sinRaw.coste).toBe(0.2);
    expect(sinRaw.productos).toEqual([]);
    const soloRaw = costeDeAviso({ id: "c", created_at: "2026-10-07T10:00:00Z", call_id: null, tipo: null, duracion_s: null, coste_eur: null, raw: { cost: { combined_cost: 6.1 } } });
    expect(soloRaw.coste).toBeCloseTo(0.061, 4);
    expect(soloRaw.costePorMinuto).toBeNull();
  });
});

describe("resumirGastos", () => {
  const llamadas = [
    costeDeAviso({ id: "a", created_at: "2026-10-07T16:33:39Z", call_id: "1", tipo: "averia_comunidad", duracion_s: 134, coste_eur: "0.3277", raw: rawRetell }),
    costeDeAviso({ id: "b", created_at: "2026-10-06T08:00:00Z", call_id: "2", tipo: "recibo", duracion_s: 60, coste_eur: 0.1, raw: null }),
  ];
  const ia: CosteIa[] = [
    { id: "i1", created_at: "2026-10-07T18:00:00Z", canal: "web", origen: "chat", session_id: "s", aviso_id: null, proveedor: "openai", modelo: "gpt-4.1", tokens_entrada: 1200, tokens_salida: 150, coste_eur: 0.0036 },
    { id: "i2", created_at: "2026-10-07T18:01:00Z", canal: "web", origen: "chat", session_id: "s", aviso_id: null, proveedor: "openai", modelo: "gpt-4.1", tokens_entrada: 1400, tokens_salida: 120, coste_eur: "0.0038" },
    { id: "i3", created_at: "2026-10-06T18:01:00Z", canal: "telegram", origen: "partes", session_id: null, aviso_id: null, proveedor: "openai", modelo: "gpt-4o-transcribe", tokens_entrada: 0, tokens_salida: 0, coste_eur: 0.01 },
  ];
  it("agrega llamadas, productos, IA y total", () => {
    const r = resumirGastos(llamadas, ia);
    expect(r.llamadas.n).toBe(2);
    expect(r.llamadas.coste).toBeCloseTo(0.4277, 4);
    expect(r.llamadas.costeMedio).toBeCloseTo(0.21385, 4);
    expect(r.llamadas.minutos).toBe(3.2);
    expect(r.llamadas.conDesglose).toBe(1);
    expect(r.llamadas.porProducto[0].producto).toBe("retell_voice_engine");
    expect(r.llamadas.porProducto.reduce((s, p) => s + p.porcentaje, 0)).toBeCloseTo(100, 6);
    expect(r.llamadas.masCara?.id).toBe("a");
    expect(r.ia.n).toBe(3);
    expect(r.ia.coste).toBeCloseTo(0.0174, 4);
    expect(r.ia.tokensEntrada).toBe(2600);
    expect(r.ia.porModelo[0]).toMatchObject({ modelo: "gpt-4o-transcribe", n: 1 });
    expect(r.ia.porOrigen.map((o) => o.origen)).toEqual(["partes", "chat"]);
    expect(r.total).toBeCloseTo(0.4451, 4);
  });
  it("serie diaria en hora de Vitoria, ordenada", () => {
    const r = resumirGastos(llamadas, ia);
    expect(r.porDia.map((d) => d.dia)).toEqual(["2026-10-06", "2026-10-07"]);
    expect(r.porDia[1]).toMatchObject({ llamadas: 1, voz: 0.3277 });
    expect(r.porDia[1].ia).toBeCloseTo(0.0074, 4);
  });
  it("vacío no rompe", () => {
    const r = resumirGastos([], []);
    expect(r.total).toBe(0);
    expect(r.llamadas.costeMedio).toBeNull();
    expect(r.porDia).toEqual([]);
  });
});

describe("estimarCoste", () => {
  it("usa la tabla de precios por modelo", () => {
    expect(estimarCoste("gpt-4.1", 1_000_000, 0)).toBe(2);
    expect(estimarCoste("gpt-4.1-mini-2025", 0, 1_000_000)).toBe(1.6);
    expect(estimarCoste("modelo-desconocido", 10, 10)).toBeNull();
    expect(estimarCoste(null, 10, 10)).toBeNull();
  });
});
