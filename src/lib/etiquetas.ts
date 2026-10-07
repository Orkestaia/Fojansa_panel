import type {
  CanalAviso,
  CanalParte,
  EstadoAviso,
  EstadoContacto,
  EstadoParte,
  TipoAviso,
  TipoCliente,
} from "./tipos";

/** Nombres humanos de todos los enumerados (spec §1: "nombres de campo humanos"). */

export const ETIQUETA_CANAL: Record<CanalAviso | CanalParte, string> = {
  voz: "Voz",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  web: "Chat",
  manual: "Manual",
};

export const ETIQUETA_TIPO: Record<TipoAviso, string> = {
  averia_comunidad: "Avería comunidad",
  averia_particular: "Avería particular",
  recibo: "Recibo",
  otro: "Otro",
  persona: "Quería persona",
  urgencia: "Urgencia",
  silencio: "Silencio",
};

export const ETIQUETA_ESTADO_AVISO: Record<EstadoAviso, string> = {
  nuevo: "Nuevo",
  revisar: "Revisar",
  pasado_al_programa: "Pasado al programa",
  cerrado: "Cerrado",
};

export const ETIQUETA_ESTADO_CONTACTO: Record<EstadoContacto, string> = {
  activo: "Activo",
  sin_contrato: "Sin contrato",
  pago_pendiente: "Pago pendiente",
  revisar: "Revisar",
  desconocido: "Desconocido",
};

export const ETIQUETA_TIPO_CLIENTE: Record<TipoCliente, string> = {
  comunidad: "Comunidad",
  particular: "Particular",
  empresa: "Empresa",
  desconocido: "Desconocido",
};

export const ETIQUETA_ESTADO_PARTE: Record<EstadoParte, string> = {
  pendiente_revision: "Pendiente de revisión",
  validado: "Validado",
  corregido: "Corregido",
  descartado: "Descartado",
};

export const ETIQUETA_ALCANCE: Record<string, string> = {
  individual: "Solo su vivienda",
  general: "Toda la comunidad",
  desconocido: "No lo sabe",
};

export const ETIQUETA_IDIOMA: Record<string, string> = {
  es: "Español",
  eu: "Euskera",
  pt: "Portugués",
  ro: "Rumano",
  ar: "Árabe",
  en: "Inglés",
  fr: "Francés",
  ur: "Urdu",
  ru: "Ruso",
  uk: "Ucraniano",
  bg: "Búlgaro",
  pl: "Polaco",
};

export function etiqueta<K extends string>(mapa: Record<K, string>, valor: K | null | undefined) {
  if (!valor) return "—";
  return mapa[valor] ?? valor;
}

/** Valores "sí / no / no sabe / no_preguntado" que devuelve el agente de voz. */
export function etiquetaSiNo(v: string | boolean | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  if (v === true) return "Sí";
  if (v === false) return "No";
  const t = v.toLowerCase();
  if (["si", "sí", "true", "yes"].includes(t)) return "Sí";
  if (["no", "false"].includes(t)) return "No";
  if (t === "no_sabe" || t === "no sabe") return "No lo sabe";
  if (t === "no_preguntado") return "No se preguntó";
  return v;
}
