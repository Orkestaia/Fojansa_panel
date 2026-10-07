import { z } from "zod";
import { ESTADOS_CONTACTO, ESTADOS_PARTE, TIPOS_CLIENTE } from "./tipos";

/** Esquemas zod de los cuerpos que aceptan las route handlers (fuera de los route.ts, que solo pueden exportar métodos). */

export const EsquemaContacto = z.object({
  telefono: z.string().trim().max(30).nullable().optional(),
  nombre: z.string().trim().max(200).nullable().optional(),
  direccion: z.string().trim().max(300).nullable().optional(),
  piso: z.string().trim().max(100).nullable().optional(),
  tipo_cliente: z.enum(TIPOS_CLIENTE).nullable().optional(),
  comunidad_id: z.string().uuid().nullable().optional(),
  contrato_mantenimiento: z.boolean().nullable().optional(),
  estado: z.enum(ESTADOS_CONTACTO).nullable().optional(),
  canal_preferido: z.string().trim().max(30).nullable().optional(),
  notas: z.string().trim().max(5000).nullable().optional(),
});

export const EsquemaComunidad = z.object({
  nombre: z.string().trim().max(200).nullable().optional(),
  direccion: z.string().trim().min(1).max(300).optional(),
  administrador: z.string().trim().max(200).nullable().optional(),
  contrato_vigente: z.boolean().optional(),
  pagos_al_dia: z.boolean().optional(),
  tipo_instalacion: z.string().trim().max(200).nullable().optional(),
  notas: z.string().trim().max(5000).nullable().optional(),
});

const numeroOpcional = z.union([z.number(), z.string().trim()]).nullable().optional();

export const EsquemaParte = z.object({
  estado: z.enum(ESTADOS_PARTE).optional(),
  obra: z.string().trim().max(200).nullable().optional(),
  partida: z.string().trim().max(200).nullable().optional(),
  trabajo_realizado: z.string().trim().max(2000).nullable().optional(),
  cantidad: numeroOpcional,
  unidad: z.string().trim().max(30).nullable().optional(),
  horas: numeroOpcional,
  materiales: z.string().trim().max(2000).nullable().optional(),
  incidencias: z.string().trim().max(2000).nullable().optional(),
  operario_nombre: z.string().trim().max(200).nullable().optional(),
  fecha_trabajo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  motivo_revisar: z.string().trim().max(500).nullable().optional(),
});
