import type { Aviso, Comunidad, Contacto, EstadoContacto, TipoCliente } from "./tipos";

/**
 * Reglas del CRM ligero (spec §2.3). Funciones puras; el acceso a datos está en `datos/`.
 */

/** Deja solo dígitos y quita el prefijo +34 / 0034. Devuelve null si no parece un teléfono. */
export function normalizarTelefono(telefono: string | null | undefined): string | null {
  if (!telefono) return null;
  let d = telefono.replace(/\D/g, "");
  if (d.startsWith("0034")) d = d.slice(4);
  else if (d.startsWith("34") && d.length === 11) d = d.slice(2);
  if (d.length < 9) return null;
  return d;
}

/** `averia_comunidad` → comunidad, `averia_particular` → particular, resto → desconocido. */
export function tipoClienteDesdeAviso(aviso: Pick<Aviso, "tipo" | "comunidad_reconocida">): TipoCliente {
  if (aviso.tipo === "averia_comunidad" || aviso.tipo === "recibo") return "comunidad";
  if (aviso.tipo === "averia_particular") return "particular";
  if (aviso.comunidad_reconocida) return "comunidad";
  return "desconocido";
}

/**
 * Estado derivado de la comunidad enlazada: `pagos_al_dia = false` → pago pendiente;
 * `contrato_vigente = false` → sin contrato; con comunidad al día → activo. Sin comunidad, se
 * respeta lo que haya a mano (o "desconocido").
 */
export function estadoContactoDerivado(
  contacto: Pick<Contacto, "estado" | "contrato_mantenimiento">,
  comunidad: Pick<Comunidad, "pagos_al_dia" | "contrato_vigente"> | null | undefined,
): EstadoContacto {
  if (comunidad) {
    if (!comunidad.pagos_al_dia) return "pago_pendiente";
    if (!comunidad.contrato_vigente) return "sin_contrato";
    return contacto.estado && contacto.estado !== "desconocido" ? contacto.estado : "activo";
  }
  if (contacto.contrato_mantenimiento === false) return "sin_contrato";
  if (contacto.contrato_mantenimiento === true) {
    return contacto.estado && contacto.estado !== "desconocido" ? contacto.estado : "activo";
  }
  return contacto.estado ?? "desconocido";
}

/** "sí"/"si"/"true" → true, "no" → false, otra cosa → null. */
export function contratoDesdeTexto(v: string | null | undefined): boolean | null {
  if (!v) return null;
  const t = v.trim().toLowerCase();
  if (["si", "sí", "true", "yes"].includes(t)) return true;
  if (["no", "false"].includes(t)) return false;
  return null;
}

/** Datos para crear un contacto nuevo a partir de un aviso. */
export function contactoDesdeAviso(aviso: Aviso, telefono: string) {
  return {
    telefono,
    nombre: aviso.nombre?.trim() || null,
    direccion: aviso.direccion?.trim() || null,
    piso: aviso.piso?.trim() || null,
    tipo_cliente: tipoClienteDesdeAviso(aviso),
    comunidad_id: aviso.comunidad_id ?? null,
    contrato_mantenimiento: contratoDesdeTexto(aviso.contrato_mantenimiento),
    canal_preferido: aviso.canal,
    estado: "desconocido" as EstadoContacto,
  };
}

/** Qué rellenar en un contacto existente con lo que trae el aviso (solo huecos). */
export function completarContacto(contacto: Contacto, aviso: Aviso): Partial<Contacto> {
  const cambios: Partial<Contacto> = {};
  if (!contacto.nombre && aviso.nombre) cambios.nombre = aviso.nombre.trim();
  if (!contacto.direccion && aviso.direccion) cambios.direccion = aviso.direccion.trim();
  if (!contacto.piso && aviso.piso) cambios.piso = aviso.piso.trim();
  if (!contacto.comunidad_id && aviso.comunidad_id) cambios.comunidad_id = aviso.comunidad_id;
  if ((!contacto.tipo_cliente || contacto.tipo_cliente === "desconocido") && aviso.tipo) {
    const t = tipoClienteDesdeAviso(aviso);
    if (t !== "desconocido") cambios.tipo_cliente = t;
  }
  if (contacto.contrato_mantenimiento === null) {
    const c = contratoDesdeTexto(aviso.contrato_mantenimiento);
    if (c !== null) cambios.contrato_mantenimiento = c;
  }
  return cambios;
}
