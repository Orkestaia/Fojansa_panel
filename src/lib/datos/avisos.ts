import "server-only";
import { completarContacto, contactoDesdeAviso, normalizarTelefono } from "../contactos";
import { filtrarPorTexto } from "../euskera";
import { supabaseAdmin, TABLAS } from "../supabase";
import type { Aviso, CanalAviso, Comunidad, Contacto, EstadoAviso, TipoAviso } from "../tipos";

export interface FiltrosAvisos {
  estado?: EstadoAviso | "abiertos";
  canal?: CanalAviso | "chat";
  tipo?: TipoAviso;
  urgente?: boolean;
  desde?: Date;
  hasta?: Date;
  q?: string;
  contactoId?: string;
  comunidadId?: string;
  limite?: number;
}

const CANALES_CHAT: CanalAviso[] = ["web", "whatsapp", "telegram"];

export async function listarAvisos(f: FiltrosAvisos = {}): Promise<Aviso[]> {
  let q = supabaseAdmin()
    .from(TABLAS.avisos)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(f.limite ?? 500);
  if (f.estado === "abiertos") q = q.in("estado", ["nuevo", "revisar"]);
  else if (f.estado) q = q.eq("estado", f.estado);
  if (f.canal === "chat") q = q.in("canal", CANALES_CHAT);
  else if (f.canal) q = q.eq("canal", f.canal);
  if (f.tipo) q = q.eq("tipo", f.tipo);
  if (f.urgente !== undefined) q = q.eq("urgente", f.urgente);
  if (f.desde) q = q.gte("created_at", f.desde.toISOString());
  if (f.hasta) q = q.lt("created_at", f.hasta.toISOString());
  if (f.contactoId) q = q.eq("contacto_id", f.contactoId);
  if (f.comunidadId) q = q.eq("comunidad_id", f.comunidadId);
  const { data, error } = await q;
  if (error) throw new Error(`Avisos: ${error.message}`);
  const avisos = (data ?? []) as Aviso[];
  // El texto libre se filtra en memoria para aplicar la equivalencia de euskera (spec §2.7).
  return filtrarPorTexto(avisos, f.q, (a) => [
    a.direccion,
    a.piso,
    a.nombre,
    a.telefono,
    a.descripcion,
    a.resumen,
    a.call_id,
  ]);
}

export async function obtenerAviso(id: string): Promise<Aviso | null> {
  const { data, error } = await supabaseAdmin().from(TABLAS.avisos).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Aviso: ${error.message}`);
  return (data as Aviso | null) ?? null;
}

export type CambiosAviso = Partial<
  Pick<Aviso, "estado" | "motivo_revisar" | "pasado_por" | "pasado_at" | "contacto_id" | "comunidad_id" | "derivado_a" | "derivado_at">
>;

export async function actualizarAviso(id: string, cambios: CambiosAviso): Promise<Aviso> {
  const { data, error } = await supabaseAdmin()
    .from(TABLAS.avisos)
    .update({ ...cambios, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`Actualizar aviso: ${error.message}`);
  return data as Aviso;
}

/** Mapa id → comunidad para pintar la bandeja sin un join por fila. */
export async function mapaComunidades(): Promise<Map<string, Comunidad>> {
  const { data, error } = await supabaseAdmin().from(TABLAS.comunidades).select("*");
  if (error) throw new Error(`Comunidades: ${error.message}`);
  return new Map((data as Comunidad[]).map((c) => [c.id, c]));
}

/**
 * Creación automática de contactos (spec §2.3): para cada aviso sin `contacto_id` y con teléfono,
 * busca el contacto por teléfono; si no existe lo crea con los datos del aviso; si existe,
 * rellena huecos y toca `updated_at`. Se llama al abrir la bandeja y desde `POST /api/avisos/vincular`.
 */
export async function vincularAvisosSinContacto(): Promise<{ vinculados: number; creados: number }> {
  const sb = supabaseAdmin();
  const { data: pendientes, error } = await sb
    .from(TABLAS.avisos)
    .select("*")
    .is("contacto_id", null)
    .not("telefono", "is", null)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(`Vincular: ${error.message}`);
  const avisos = (pendientes ?? []) as Aviso[];
  if (avisos.length === 0) return { vinculados: 0, creados: 0 };

  const { data: contactosData, error: e2 } = await sb.from(TABLAS.contactos).select("*");
  if (e2) throw new Error(`Contactos: ${e2.message}`);
  const porTelefono = new Map<string, Contacto>();
  for (const c of contactosData as Contacto[]) {
    const t = normalizarTelefono(c.telefono);
    if (t && !porTelefono.has(t)) porTelefono.set(t, c);
  }

  let vinculados = 0;
  let creados = 0;
  for (const aviso of avisos) {
    const telefono = normalizarTelefono(aviso.telefono);
    if (!telefono) continue;
    let contacto = porTelefono.get(telefono);
    const ahora = new Date().toISOString();
    if (!contacto) {
      const { data: nuevo, error: e3 } = await sb
        .from(TABLAS.contactos)
        .insert(contactoDesdeAviso(aviso, telefono))
        .select("*")
        .single();
      if (e3) throw new Error(`Crear contacto: ${e3.message}`);
      contacto = nuevo as Contacto;
      porTelefono.set(telefono, contacto);
      creados++;
    } else {
      const cambios = completarContacto(contacto, aviso);
      const { data: actualizado, error: e4 } = await sb
        .from(TABLAS.contactos)
        .update({ ...cambios, updated_at: ahora })
        .eq("id", contacto.id)
        .select("*")
        .single();
      if (e4) throw new Error(`Actualizar contacto: ${e4.message}`);
      contacto = actualizado as Contacto;
      porTelefono.set(telefono, contacto);
    }
    const { error: e5 } = await sb
      .from(TABLAS.avisos)
      .update({ contacto_id: contacto.id, updated_at: ahora })
      .eq("id", aviso.id);
    if (e5) throw new Error(`Enlazar aviso: ${e5.message}`);
    vinculados++;
  }
  return { vinculados, creados };
}
