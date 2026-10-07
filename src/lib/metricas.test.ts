import { describe, expect, it } from "vitest";
import { calcularMetricas, esSatisfactorio, resumenPartes, type AvisoMetrica } from "./metricas";

function aviso(p: Partial<AvisoMetrica>): AvisoMetrica {
  return {
    canal: "voz",
    tipo: "averia_comunidad",
    urgente: false,
    datos_completos: true,
    estado: "nuevo",
    coste_eur: "0.20",
    duracion_s: 120,
    created_at: "2026-10-07T08:30:00+02:00",
    ...p,
  };
}

describe("esSatisfactorio", () => {
  it("datos completos y no en revisión", () => {
    expect(esSatisfactorio({ datos_completos: true, estado: "nuevo", tipo: "recibo" })).toBe(true);
    expect(esSatisfactorio({ datos_completos: true, estado: "revisar", tipo: "recibo" })).toBe(false);
    expect(esSatisfactorio({ datos_completos: false, estado: "nuevo", tipo: "recibo" })).toBe(false);
  });
  it("un silencio nunca es satisfactorio", () => {
    expect(esSatisfactorio({ datos_completos: true, estado: "cerrado", tipo: "silencio" })).toBe(false);
  });
});

describe("calcularMetricas", () => {
  it("vacío no divide por cero", () => {
    const m = calcularMetricas([]);
    expect(m.total).toBe(0);
    expect(m.porcentajeSatisfactorios).toBeNull();
    expect(m.costeMedio).toBeNull();
    expect(m.duracionMedia).toBeNull();
    expect(m.porHora).toHaveLength(24);
  });

  it("cuenta canales, satisfactorios, revisar y urgentes", () => {
    const m = calcularMetricas([
      aviso({}),
      aviso({ canal: "web", coste_eur: null, duracion_s: null }),
      aviso({ estado: "revisar", datos_completos: false, coste_eur: "0.10", duracion_s: 60 }),
      aviso({ tipo: "urgencia", urgente: true, estado: "revisar", coste_eur: "0.06", duracion_s: 40 }),
      aviso({ tipo: "silencio", datos_completos: false, estado: "cerrado", coste_eur: "0.02", duracion_s: 15 }),
    ]);
    expect(m.total).toBe(5);
    expect(m.porCanal).toEqual({ voz: 4, chat: 1, otros: 0 });
    expect(m.avisosReales).toBe(4);
    expect(m.satisfactorios).toBe(2);
    expect(m.porcentajeSatisfactorios).toBe(50);
    expect(m.paraRevisar).toBe(2);
    expect(m.urgentes).toBe(1);
  });

  it("coste total y medio solo sobre las filas con coste; numeric llega como texto", () => {
    const m = calcularMetricas([
      aviso({ coste_eur: "0.30" }),
      aviso({ coste_eur: 0.1 }),
      aviso({ canal: "web", coste_eur: null, duracion_s: null }),
    ]);
    expect(m.costeTotal).toBeCloseTo(0.4, 4);
    expect(m.llamadasConCoste).toBe(2);
    expect(m.costeMedio).toBeCloseTo(0.2, 4);
    expect(m.duracionMedia).toBe(120);
  });

  it("agrupa por hora de Vitoria, no UTC", () => {
    // 22:30 UTC del 7-oct = 00:30 del 8-oct en Madrid (horario de verano, UTC+2)
    const m = calcularMetricas([aviso({ created_at: "2026-10-07T22:30:00Z" })]);
    expect(m.porHora[0]).toBe(1);
    expect(m.porHora[22]).toBe(0);
  });

  it("por tipo mantiene el orden fijo de la spec y oculta 'sin_tipo' si no hay", () => {
    const m = calcularMetricas([aviso({ tipo: "recibo" }), aviso({ tipo: "recibo" }), aviso({ tipo: "otro" })]);
    expect(m.porTipo.map((x) => x.tipo)).toEqual([
      "averia_comunidad",
      "averia_particular",
      "recibo",
      "otro",
      "persona",
      "urgencia",
      "silencio",
    ]);
    expect(m.porTipo.find((x) => x.tipo === "recibo")?.n).toBe(2);
    const conNulo = calcularMetricas([aviso({ tipo: null })]);
    expect(conNulo.porTipo.at(-1)).toEqual({ tipo: "sin_tipo", n: 1 });
  });
});

describe("resumenPartes", () => {
  it("cuenta pendientes", () => {
    expect(resumenPartes([{ estado: "validado" }, { estado: "pendiente_revision" }])).toEqual({
      total: 2,
      pendientes: 1,
    });
  });
});
