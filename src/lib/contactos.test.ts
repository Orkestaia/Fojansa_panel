import { describe, expect, it } from "vitest";
import {
  completarContacto,
  contratoDesdeTexto,
  estadoContactoDerivado,
  normalizarTelefono,
  tipoClienteDesdeAviso,
} from "./contactos";
import type { Aviso, Contacto } from "./tipos";

describe("normalizarTelefono", () => {
  it("quita espacios, guiones y prefijo", () => {
    expect(normalizarTelefono("945 12 11 67")).toBe("945121167");
    expect(normalizarTelefono("+34 628-993-028")).toBe("628993028");
    expect(normalizarTelefono("0034628993028")).toBe("628993028");
  });
  it("rechaza lo que no es un teléfono", () => {
    expect(normalizarTelefono("no tiene")).toBeNull();
    expect(normalizarTelefono("1234")).toBeNull();
    expect(normalizarTelefono(null)).toBeNull();
  });
});

describe("tipoClienteDesdeAviso", () => {
  it("deduce el tipo por el tipo de aviso", () => {
    expect(tipoClienteDesdeAviso({ tipo: "averia_comunidad", comunidad_reconocida: null })).toBe("comunidad");
    expect(tipoClienteDesdeAviso({ tipo: "averia_particular", comunidad_reconocida: null })).toBe("particular");
    expect(tipoClienteDesdeAviso({ tipo: "recibo", comunidad_reconocida: null })).toBe("comunidad");
    expect(tipoClienteDesdeAviso({ tipo: "urgencia", comunidad_reconocida: true })).toBe("comunidad");
    expect(tipoClienteDesdeAviso({ tipo: "otro", comunidad_reconocida: false })).toBe("desconocido");
  });
});

describe("estadoContactoDerivado", () => {
  const base = { estado: "desconocido" as const, contrato_mantenimiento: null };
  it("la comunidad manda: pagos pendientes antes que contrato", () => {
    expect(estadoContactoDerivado(base, { pagos_al_dia: false, contrato_vigente: false })).toBe("pago_pendiente");
    expect(estadoContactoDerivado(base, { pagos_al_dia: true, contrato_vigente: false })).toBe("sin_contrato");
    expect(estadoContactoDerivado(base, { pagos_al_dia: true, contrato_vigente: true })).toBe("activo");
  });
  it("respeta el estado puesto a mano si la comunidad está al día", () => {
    expect(estadoContactoDerivado({ estado: "revisar", contrato_mantenimiento: null }, { pagos_al_dia: true, contrato_vigente: true })).toBe("revisar");
  });
  it("sin comunidad, usa el contrato del particular", () => {
    expect(estadoContactoDerivado({ ...base, contrato_mantenimiento: false }, null)).toBe("sin_contrato");
    expect(estadoContactoDerivado({ ...base, contrato_mantenimiento: true }, null)).toBe("activo");
    expect(estadoContactoDerivado(base, null)).toBe("desconocido");
  });
});

describe("contratoDesdeTexto", () => {
  it("sí/no/otro", () => {
    expect(contratoDesdeTexto("sí")).toBe(true);
    expect(contratoDesdeTexto("no")).toBe(false);
    expect(contratoDesdeTexto("no_preguntado")).toBeNull();
    expect(contratoDesdeTexto("")).toBeNull();
  });
});

describe("completarContacto", () => {
  const contacto = {
    id: "c1",
    nombre: null,
    direccion: "Fernando Maturana 24",
    piso: null,
    tipo_cliente: "desconocido",
    comunidad_id: null,
    contrato_mantenimiento: null,
  } as unknown as Contacto;
  const aviso = {
    nombre: " Miguel Prueba ",
    direccion: "Otra 1",
    piso: "3º",
    tipo: "averia_comunidad",
    comunidad_id: "com1",
    comunidad_reconocida: true,
    contrato_mantenimiento: "si",
  } as unknown as Aviso;
  it("rellena solo los huecos", () => {
    expect(completarContacto(contacto, aviso)).toEqual({
      nombre: "Miguel Prueba",
      piso: "3º",
      comunidad_id: "com1",
      tipo_cliente: "comunidad",
      contrato_mantenimiento: true,
    });
  });
});
