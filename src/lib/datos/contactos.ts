import "server-only";
import { estadoContactoDerivado, normalizarTelefono } from "../contactos";
import { filtrarPorTexto } from "../euskera";
import { supabaseAdmin, TABLAS } from "../supabase";
import type { Aviso, Comunidad, Contacto, EstadoContacto } from "../tipos";

export interface ContactoConResumen extends Contacto {
  comunidad: Comunidad | null;
  /** Estado derivado de la comunidad (spec §2.3), el que se enseña. */
  estado_efectivo: EstadoContacto;
  n_avisos: number;
  ultimo_aviso: string | null;
}

export async function listarContactos(q?: string, estado?: EstadoContacto): Promise<ContactoConResumen[]> {
  const sb = supabaseAdmin();
  const [contactos, comunidades, avisos] = await Promise.all([
    sb.from(TABLAS.contactos).select("*").order("updated_at", { ascending: false }),
    sb.from(TABLAS.comunidades).select("*"),
    sb.from(TABLAS.avisos).select("contacto_id, created_at").not("contacto_id", "is", null),
  ]);
  if (contactos.error) throw new Error(`Contactos: ${contactos.error.message}`);
  if (comunidades.error) throw new Error(`Comunidades: ${comunidades.error.message}`);
  if (avisos.error) throw new Error(`Avisos: ${avisos.error.message}`);

  const mapaCom = new Map((comunidades.data as Comunidad[]).map((c) => [c.id, c]));
  const resumen = new Map<string, { n: number; ultimo: string }>();
  for (const a of avisos.data as Array<{ contacto_id: string; created_at: string }>) {
    const r = resumen.get(a.contacto_id);
    if (!r) resumen.set(a.contacto_id, { n: 1, ultimo: a.created_at });
    else {
      r.n++;
      if (a.created_at > r.ultimo) r.ultimo = a.created_at;
    }
  }

  let lista = (contactos.data as Contacto[]).map((c) => {
    const comunidad = c.comunidad_id ? (mapaCom.get(c.comunidad_id) ?? null) : null;
    const r = resumen.get(c.id);
    return {
      ...c,
      comunidad,
      estado_efectivo: estadoContactoDerivado(c, comunidad),
      n_avisos: r?.n ?? 0,
      ultimo_aviso: r?.ultimo ?? null,
    } satisfies ContactoConResumen;
  });
  if (estado) lista = lista.filter((c) => c.estado_efectivo === estado);
  lista.sort((a, b) => (b.ultimo_aviso ?? b.updated_at).localeCompare(a.ultimo_aviso ?? a.updated_at));
  return filtrarPorTexto(lista, q, (c) => [c.nombre, c.telefono, c.direccion, c.piso, c.comunidad?.nombre]);
}

export async function obtenerContacto(id: string): Promise<(Contacto & { comunidad: Comunidad | null; estado_efectivo: EstadoContacto }) | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from(TABLAS.contactos).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Contacto: ${error.message}`);
  if (!data) return null;
  const c = data as Contacto;
  let comunidad: Comunidad | null = null;
  if (c.comunidad_id) {
    const r = await sb.from(TABLAS.comunidades).select("*").eq("id", c.comunidad_id).maybeSingle();
    comunidad = (r.data as Comunidad | null) ?? null;
  }
  return { ...c, comunidad, estado_efectivo: estadoContactoDerivado(c, comunidad) };
}

export async function avisosDelContacto(contactoId: string): Promise<Aviso[]> {
  const { data, error } = await supabaseAdmin()
    .from(TABLAS.avisos)
    .select("*")
    .eq("contacto_id", contactoId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Avisos del contacto: ${error.message}`);
  return data as Aviso[];
}

export type DatosContacto = Partial<
  Pick<
    Contacto,
    | "telefono"
    | "nombre"
    | "direccion"
    | "piso"
    | "tipo_cliente"
    | "comunidad_id"
    | "contrato_mantenimiento"
    | "estado"
    | "canal_preferido"
    | "notas"
  >
>;

export async function crearContacto(datos: DatosContacto): Promise<Contacto> {
  const telefono = datos.telefono ? (normalizarTelefono(datos.telefono) ?? datos.telefono) : null;
  const { data, error } = await supabaseAdmin()
    .from(TABLAS.contactos)
    .insert({ ...datos, telefono })
    .select("*")
    .single();
  if (error) throw new Error(`Crear contacto: ${error.message}`);
  return data as Contacto;
}

export async function actualizarContacto(id: string, datos: DatosContacto): Promise<Contacto> {
  const cambios: Record<string, unknown> = { ...datos, updated_at: new Date().toISOString() };
  if (datos.telefono !== undefined && datos.telefono) {
    cambios.telefono = normalizarTelefono(datos.telefono) ?? datos.telefono;
  }
  const { data, error } = await supabaseAdmin()
    .from(TABLAS.contactos)
    .update(cambios)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`Actualizar contacto: ${error.message}`);
  return data as Contacto;
}
