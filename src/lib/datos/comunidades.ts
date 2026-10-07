import "server-only";
import type { ComunidadImportada } from "../csv";
import { filtrarPorTexto, normalizarTexto } from "../euskera";
import { supabaseAdmin, TABLAS } from "../supabase";
import type { Comunidad } from "../tipos";

export interface ComunidadConResumen extends Comunidad {
  n_avisos: number;
  n_contactos: number;
}

export async function listarComunidades(q?: string): Promise<ComunidadConResumen[]> {
  const sb = supabaseAdmin();
  const [comunidades, avisos, contactos] = await Promise.all([
    sb.from(TABLAS.comunidades).select("*").order("direccion"),
    sb.from(TABLAS.avisos).select("comunidad_id").not("comunidad_id", "is", null),
    sb.from(TABLAS.contactos).select("comunidad_id").not("comunidad_id", "is", null),
  ]);
  if (comunidades.error) throw new Error(`Comunidades: ${comunidades.error.message}`);
  if (avisos.error) throw new Error(`Avisos: ${avisos.error.message}`);
  if (contactos.error) throw new Error(`Contactos: ${contactos.error.message}`);
  const cuenta = (filas: Array<{ comunidad_id: string }>) => {
    const m = new Map<string, number>();
    for (const f of filas) m.set(f.comunidad_id, (m.get(f.comunidad_id) ?? 0) + 1);
    return m;
  };
  const nAvisos = cuenta(avisos.data as Array<{ comunidad_id: string }>);
  const nContactos = cuenta(contactos.data as Array<{ comunidad_id: string }>);
  const lista = (comunidades.data as Comunidad[]).map((c) => ({
    ...c,
    n_avisos: nAvisos.get(c.id) ?? 0,
    n_contactos: nContactos.get(c.id) ?? 0,
  }));
  return filtrarPorTexto(lista, q, (c) => [c.direccion, c.nombre, c.administrador]);
}

export async function obtenerComunidad(id: string): Promise<Comunidad | null> {
  const { data, error } = await supabaseAdmin().from(TABLAS.comunidades).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Comunidad: ${error.message}`);
  return (data as Comunidad | null) ?? null;
}

export type DatosComunidad = Partial<
  Pick<Comunidad, "nombre" | "direccion" | "administrador" | "contrato_vigente" | "pagos_al_dia" | "tipo_instalacion" | "notas">
>;

// `direccion_normalizada` es una columna GENERATED ALWAYS en la BD: nunca se escribe desde aquí.

export async function crearComunidad(datos: DatosComunidad & { direccion: string }): Promise<Comunidad> {
  const { data, error } = await supabaseAdmin().from(TABLAS.comunidades).insert(datos).select("*").single();
  if (error) throw new Error(`Crear comunidad: ${error.message}`);
  return data as Comunidad;
}

export async function actualizarComunidad(id: string, datos: DatosComunidad): Promise<Comunidad> {
  const { data, error } = await supabaseAdmin()
    .from(TABLAS.comunidades)
    .update(datos)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`Actualizar comunidad: ${error.message}`);
  return data as Comunidad;
}

/**
 * Importación CSV (spec §2.4): la dirección es la clave. Si ya existe una comunidad con la misma
 * dirección normalizada se actualiza (nombre, administrador, contrato, pagos); si no, se crea.
 * Nunca se borra nada: lo que no viene en el CSV se queda como estaba.
 */
export async function importarComunidades(
  filas: ComunidadImportada[],
): Promise<{ creadas: number; actualizadas: number }> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from(TABLAS.comunidades).select("id, direccion");
  if (error) throw new Error(`Comunidades: ${error.message}`);
  // Clave propia (sin tildes) en vez de `direccion_normalizada` de la BD, que las conserva.
  const existentes = new Map<string, string>();
  for (const c of data as Array<{ id: string; direccion: string }>) {
    existentes.set(normalizarTexto(c.direccion), c.id);
  }
  let creadas = 0;
  let actualizadas = 0;
  for (const f of filas) {
    const clave = normalizarTexto(f.direccion);
    const id = existentes.get(clave);
    const datos = {
      direccion: f.direccion,
      nombre: f.nombre,
      administrador: f.administrador,
      contrato_vigente: f.contrato_vigente,
      pagos_al_dia: f.pagos_al_dia,
      ...(f.tipo_instalacion ? { tipo_instalacion: f.tipo_instalacion } : {}),
      ...(f.notas ? { notas: f.notas } : {}),
    };
    if (id) {
      const { error: e } = await sb.from(TABLAS.comunidades).update(datos).eq("id", id);
      if (e) throw new Error(`Actualizar ${f.direccion}: ${e.message}`);
      actualizadas++;
    } else {
      const { data: nueva, error: e } = await sb.from(TABLAS.comunidades).insert(datos).select("id").single();
      if (e) throw new Error(`Crear ${f.direccion}: ${e.message}`);
      existentes.set(clave, (nueva as { id: string }).id);
      creadas++;
    }
  }
  return { creadas, actualizadas };
}
