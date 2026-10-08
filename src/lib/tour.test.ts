import { describe, expect, it } from "vitest";
import { PASOS_TOUR, resolverPasos } from "./tour";

describe("PASOS_TOUR", () => {
  it("tiene objetivos únicos por ruta y textos cortos", () => {
    const claves = PASOS_TOUR.map((p) => `${p.ruta}|${p.objetivo}`);
    expect(new Set(claves).size).toBe(claves.length);
    for (const p of PASOS_TOUR) {
      expect(p.titulo.length).toBeLessThan(60);
      expect(p.texto.length).toBeLessThan(320);
    }
  });
  it("empieza en inicio y termina en el menú del usuario", () => {
    expect(PASOS_TOUR[0].ruta).toBe("/");
    expect(PASOS_TOUR.at(-1)?.objetivo).toBe("menu-usuario");
  });
});

describe("resolverPasos", () => {
  it("sustituye el id del aviso", () => {
    const r = resolverPasos(PASOS_TOUR, "abc");
    expect(r.some((p) => p.ruta === "/avisos/abc")).toBe(true);
    expect(r).toHaveLength(PASOS_TOUR.length);
  });
  it("sin aviso quita los pasos del detalle", () => {
    const r = resolverPasos(PASOS_TOUR, null);
    expect(r.every((p) => !p.ruta.includes("{aviso}"))).toBe(true);
    expect(r.length).toBe(PASOS_TOUR.length - 3);
  });
});
