import { describe, expect, it } from "vitest";
import { coincideEuskera, filtrarPorTexto, normalizarEuskera, normalizarTexto } from "./euskera";

describe("normalizarTexto", () => {
  it("quita tildes, mayúsculas y signos", () => {
    expect(normalizarTexto("  Los Herrán, 40 ")).toBe("los herran 40");
    expect(normalizarTexto("Pintor Vera-Fajardo 6")).toBe("pintor vera fajardo 6");
  });
});

describe("normalizarEuskera", () => {
  it("equipara tx y ch", () => {
    expect(normalizarEuskera("Goikoetxea")).toBe(normalizarEuskera("Goicoechea"));
    expect(normalizarEuskera("Txagorritxu")).toBe(normalizarEuskera("Chagorrichu"));
  });
  it("equipara tz y ts, z y s", () => {
    expect(normalizarEuskera("Aritz")).toBe(normalizarEuskera("Arits"));
    expect(normalizarEuskera("Zabalgana")).toBe(normalizarEuskera("Sabalgana"));
  });
  it("equipara k, c y qu", () => {
    expect(normalizarEuskera("Kepa")).toBe(normalizarEuskera("Quepa"));
    expect(normalizarEuskera("Etxebarria")).toBe(normalizarEuskera("Echevarría"));
    expect(normalizarEuskera("Kalea")).toBe(normalizarEuskera("Calea"));
    expect(normalizarEuskera("Mendizorrotza")).toBe(normalizarEuskera("Mendisorrotsa"));
    expect(normalizarEuskera("Jakue")).toBe(normalizarEuskera("Jacue"));
    expect(normalizarEuskera("Gasteiz")).toBe(normalizarEuskera("Gasteis"));
    // "ce" suena /s|z/, no /k/
    expect(normalizarEuskera("Vicente")).toBe(normalizarEuskera("Bizente"));
  });
  it("equipara b y v y la h muda", () => {
    expect(normalizarEuskera("Bitoria")).toBe(normalizarEuskera("Vitoria"));
    expect(normalizarEuskera("Herrán")).toBe(normalizarEuskera("Erran"));
  });
  it("no toca los números", () => {
    expect(normalizarEuskera("Fernando Maturana 24")).toBe("fernando maturana 24");
  });
});

describe("coincideEuskera", () => {
  it("encuentra la calle tecleada a oído", () => {
    expect(coincideEuskera("goicoechea 15", "Calle Vicente Goikoetxea 15")).toBe(true);
    expect(coincideEuskera("Goikoetxea", "Calle Vicente Goikoetxea 15")).toBe(true);
    expect(coincideEuskera("Maturana 22", "Fernando Maturana 24")).toBe(false);
  });
  it("todas las palabras deben estar", () => {
    expect(coincideEuskera("portal gamarra", "Portal de Gamarra 1")).toBe(true);
    expect(coincideEuskera("portal foronda", "Portal de Gamarra 1")).toBe(false);
  });
  it("consulta vacía coincide con todo salvo nulos", () => {
    expect(coincideEuskera("", "x")).toBe(true);
    expect(coincideEuskera("x", null)).toBe(false);
  });
});

describe("filtrarPorTexto", () => {
  const filas = [
    { nombre: "Yolanda González", direccion: "Vicente Goikoetxea 15" },
    { nombre: "Miguel Prueba", direccion: "Fernando Maturana 24" },
  ];
  it("busca en varios campos y respeta la grafía original", () => {
    const r = filtrarPorTexto(filas, "goicoechea", (f) => [f.nombre, f.direccion]);
    expect(r).toHaveLength(1);
    expect(r[0].direccion).toBe("Vicente Goikoetxea 15");
  });
  it("sin consulta devuelve todo", () => {
    expect(filtrarPorTexto(filas, "  ", (f) => [f.nombre])).toHaveLength(2);
  });
});
