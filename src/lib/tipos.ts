/**
 * Tipos de las cuatro tablas `fojansa_*` de Supabase ORKESTA_OPS_2026.
 * Los valores de los enumerados son los CHECK de la base de datos (spec §2 y kit §2.1):
 * si se añade uno aquí hay que añadirlo también en la tabla.
 */

export const CANALES_AVISO = ["voz", "whatsapp", "telegram", "web", "manual"] as const;
export type CanalAviso = (typeof CANALES_AVISO)[number];

export const TIPOS_AVISO = [
  "averia_comunidad",
  "averia_particular",
  "recibo",
  "otro",
  "persona",
  "urgencia",
  "silencio",
] as const;
export type TipoAviso = (typeof TIPOS_AVISO)[number];

export const ALCANCES = ["individual", "general", "desconocido"] as const;
export type Alcance = (typeof ALCANCES)[number];

export const ESTADOS_AVISO = ["nuevo", "revisar", "pasado_al_programa", "cerrado"] as const;
export type EstadoAviso = (typeof ESTADOS_AVISO)[number];

export interface Aviso {
  id: string;
  created_at: string;
  updated_at: string;
  canal: CanalAviso;
  tipo: TipoAviso | null;
  urgente: boolean;
  descripcion: string | null;
  direccion: string | null;
  piso: string | null;
  alcance: Alcance | null;
  nombre: string | null;
  telefono: string | null;
  desde_cuando: string | null;
  datos_completos: boolean;
  motivo_revisar: string | null;
  resumen: string | null;
  url_grabacion: string | null;
  call_id: string | null;
  tipo_averia: string | null;
  marca: string | null;
  modelo: string | null;
  antiguedad: string | null;
  contrato_mantenimiento: string | null;
  lectura_comprobada: string | null;
  email: string | null;
  repetida: boolean | null;
  comunidad_reconocida: boolean | null;
  comunidad_id: string | null;
  contacto_id: string | null;
  duracion_s: number | null;
  coste_eur: number | string | null;
  estado: EstadoAviso;
  pasado_por: string | null;
  pasado_at: string | null;
  /** Número o persona a la que el agente derivó la conversación (lo rellena n8n o la oficina). */
  derivado_a: string | null;
  derivado_at: string | null;
  transcripcion: string | null;
  raw: unknown;
}

export const TIPOS_CLIENTE = ["comunidad", "particular", "empresa", "desconocido"] as const;
export type TipoCliente = (typeof TIPOS_CLIENTE)[number];

export const ESTADOS_CONTACTO = [
  "activo",
  "sin_contrato",
  "pago_pendiente",
  "revisar",
  "desconocido",
] as const;
export type EstadoContacto = (typeof ESTADOS_CONTACTO)[number];

export interface Contacto {
  id: string;
  created_at: string;
  updated_at: string;
  telefono: string | null;
  nombre: string | null;
  direccion: string | null;
  piso: string | null;
  tipo_cliente: TipoCliente | null;
  comunidad_id: string | null;
  contrato_mantenimiento: boolean | null;
  estado: EstadoContacto | null;
  canal_preferido: string | null;
  notas: string | null;
}

export interface Comunidad {
  id: string;
  created_at: string;
  nombre: string | null;
  direccion: string;
  direccion_normalizada: string | null;
  administrador: string | null;
  contrato_vigente: boolean;
  pagos_al_dia: boolean;
  tipo_instalacion: string | null;
  notas: string | null;
}

export const CANALES_PARTE = ["telegram", "whatsapp", "web", "manual"] as const;
export type CanalParte = (typeof CANALES_PARTE)[number];

export const ESTADOS_PARTE = ["pendiente_revision", "validado", "corregido", "descartado"] as const;
export type EstadoParte = (typeof ESTADOS_PARTE)[number];

export interface Parte {
  id: string;
  created_at: string;
  fecha_trabajo: string;
  canal: CanalParte;
  operario_id: string | null;
  operario_nombre: string | null;
  idioma_detectado: string | null;
  audio_duracion_s: number | null;
  transcripcion_original: string | null;
  transcripcion_es: string | null;
  obra: string | null;
  partida: string | null;
  trabajo_realizado: string | null;
  cantidad: number | string | null;
  unidad: string | null;
  horas: number | string | null;
  materiales: string | null;
  incidencias: string | null;
  datos_completos: boolean;
  motivo_revisar: string | null;
  estado: EstadoParte;
  revisado_por: string | null;
  revisado_at: string | null;
  raw: unknown;
}

/** Supabase devuelve `numeric` como texto. */
export function numero(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
