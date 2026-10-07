import { describe, expect, it } from "vitest";
import { aBooleano, detectarSeparador, leerComunidadesCsv, parsearCsv } from "./csv";

describe("parsearCsv", () => {
  it("detecta ; y respeta comillas con separador dentro", () => {
    const filas = parsearCsv('a;b;c\n"x; y";2;"di""jo"\n');
    expect(filas).toEqual([
      ["a", "b", "c"],
      ["x; y", "2", 'di"jo'],
    ]);
  });
  it("acepta coma, BOM y CRLF", () => {
    const filas = parsearCsv("﻿a,b\r\n1,2\r\n\r\n");
    expect(filas).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
  it("detectarSeparador prefiere el más frecuente", () => {
    expect(detectarSeparador("a,b;c;d")).toBe(";");
    expect(detectarSeparador("a,b,c")).toBe(",");
  });
});

describe("aBooleano", () => {
  it("entiende sí/no en castellano", () => {
    expect(aBooleano("Sí")).toBe(true);
    expect(aBooleano("no")).toBe(false);
    expect(aBooleano("0")).toBe(false);
    expect(aBooleano("", false)).toBe(false);
    expect(aBooleano(undefined, true)).toBe(true);
    expect(aBooleano("pendiente")).toBe(false);
  });
});

describe("leerComunidadesCsv", () => {
  it("lee las columnas mínimas de la spec con alias humanos", () => {
    const csv = [
      "Dirección;Nombre;Administrador;Contrato vigente;Pagos al día",
      "Fernando Maturana 24;Comunidad Maturana 24;Administraciones Demo;Sí;Sí",
      "Portal de Gamarra 1;;Fincas Ejemplo;sí;No",
    ].join("\n");
    const r = leerComunidadesCsv(csv);
    expect(r.descartadas).toEqual([]);
    expect(r.comunidades).toHaveLength(2);
    expect(r.comunidades[0]).toMatchObject({
      direccion: "Fernando Maturana 24",
      nombre: "Comunidad Maturana 24",
      contrato_vigente: true,
      pagos_al_dia: true,
    });
    expect(r.comunidades[1]).toMatchObject({ nombre: null, pagos_al_dia: false });
  });

  it("descarta filas sin dirección y repetidas, y avisa si falta la columna", () => {
    const r = leerComunidadesCsv("direccion,nombre\nLos Herrán 40,A\n,B\nlos herran 40,C\n");
    expect(r.comunidades).toHaveLength(1);
    expect(r.descartadas.map((d) => d.fila)).toEqual([3, 4]);

    const sin = leerComunidadesCsv("calle_x,nombre\n1,2");
    expect(sin.comunidades).toEqual([]);
    expect(sin.descartadas[0].motivo).toMatch(/direccion/);
  });
});
