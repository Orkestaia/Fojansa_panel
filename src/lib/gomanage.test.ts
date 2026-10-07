import { describe, expect, it } from "vitest";
import { textoParaGoManage } from "./gomanage";

describe("textoParaGoManage", () => {
  it("campos en el orden de tecleo y sin vacíos", () => {
    const t = textoParaGoManage({
      direccion: "Fernando Maturana 24",
      piso: "3º izquierda",
      nombre: "Miguel Prueba",
      telefono: "628993028",
      tipo: "averia_comunidad",
      descripcion: "Calefacción sin funcionar",
      resumen: "x",
    });
    expect(t.split("\n")).toEqual([
      "Dirección: Fernando Maturana 24",
      "Piso: 3º izquierda",
      "Nombre: Miguel Prueba",
      "Teléfono: 628993028",
      "Tipo: Avería comunidad",
      "Descripción: Calefacción sin funcionar",
    ]);
  });
  it("usa el resumen si no hay descripción y omite lo que falta", () => {
    const t = textoParaGoManage({
      direccion: "Portal de Gamarra 1",
      piso: null,
      nombre: null,
      telefono: "600111222",
      tipo: "urgencia",
      descripcion: "",
      resumen: "Olor a gas en el portal.",
    });
    expect(t).toBe(
      "Dirección: Portal de Gamarra 1\nTeléfono: 600111222\nTipo: Urgencia\nDescripción: Olor a gas en el portal.",
    );
  });
});
