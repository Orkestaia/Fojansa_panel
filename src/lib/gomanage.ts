import { ETIQUETA_TIPO, etiqueta } from "./etiquetas";
import type { Aviso } from "./tipos";

/**
 * "Copiar para Go!Manage" (spec §2.2): un bloque de texto con los campos en el orden en que
 * oficina los teclea en el programa: dirección, piso, nombre, teléfono, tipo, descripción.
 * Una línea por campo, sin los que están vacíos para no tener que borrarlos a mano.
 */
export function textoParaGoManage(
  a: Pick<Aviso, "direccion" | "piso" | "nombre" | "telefono" | "tipo" | "descripcion" | "resumen">,
): string {
  const lineas: Array<[string, string | null | undefined]> = [
    ["Dirección", a.direccion],
    ["Piso", a.piso],
    ["Nombre", a.nombre],
    ["Teléfono", a.telefono],
    ["Tipo", a.tipo ? etiqueta(ETIQUETA_TIPO, a.tipo) : null],
    ["Descripción", a.descripcion || a.resumen],
  ];
  return lineas
    .filter(([, v]) => v && v.trim() !== "")
    .map(([k, v]) => `${k}: ${v!.trim()}`)
    .join("\n");
}
