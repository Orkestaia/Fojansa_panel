import { z } from "zod";
import { exigirUsuario } from "@/lib/acceso";
import { leerCuerpo, respuestaError } from "@/lib/api";
import { actualizarAviso, obtenerAviso, type CambiosAviso } from "@/lib/datos/avisos";
import { ESTADOS_AVISO } from "@/lib/tipos";

export const dynamic = "force-dynamic";

const Esquema = z.object({
  estado: z.enum(ESTADOS_AVISO).optional(),
  motivo_revisar: z.string().trim().max(500).nullable().optional(),
  contacto_id: z.string().uuid().nullable().optional(),
  comunidad_id: z.string().uuid().nullable().optional(),
  /** A quién se derivó (número o persona). Vacío/null lo borra. */
  derivado_a: z.string().trim().max(200).nullable().optional(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  try {
    const aviso = await obtenerAviso((await ctx.params).id);
    if (!aviso) return Response.json({ error: "No existe" }, { status: 404 });
    return Response.json({ aviso });
  } catch (e) {
    return respuestaError(e);
  }
}

/**
 * PATCH /api/avisos/:id (spec §3): estado, motivo_revisar, pasado_por.
 * - "pasado_al_programa" guarda quién (el usuario con sesión) y cuándo.
 * - "revisar" exige motivo. Volver a "nuevo" limpia el motivo.
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  const cuerpo = await leerCuerpo(req, Esquema);
  if ("error" in cuerpo) return cuerpo.error;
  try {
    const { id } = await ctx.params;
    const d = cuerpo.datos;
    const cambios: CambiosAviso = {};
    if (d.contacto_id !== undefined) cambios.contacto_id = d.contacto_id;
    if (d.comunidad_id !== undefined) cambios.comunidad_id = d.comunidad_id;
    if (d.motivo_revisar !== undefined) cambios.motivo_revisar = d.motivo_revisar;
    if (d.derivado_a !== undefined) {
      cambios.derivado_a = d.derivado_a || null;
      cambios.derivado_at = d.derivado_a ? new Date().toISOString() : null;
    }
    if (d.estado) {
      cambios.estado = d.estado;
      if (d.estado === "pasado_al_programa") {
        cambios.pasado_por = acceso.usuario.nombre;
        cambios.pasado_at = new Date().toISOString();
      }
      if (d.estado === "revisar" && !d.motivo_revisar) {
        return Response.json({ error: "Indica el motivo para revisar" }, { status: 400 });
      }
      if (d.estado === "nuevo" && d.motivo_revisar === undefined) cambios.motivo_revisar = null;
    }
    if (Object.keys(cambios).length === 0) return Response.json({ error: "Nada que cambiar" }, { status: 400 });
    const aviso = await actualizarAviso(id, cambios);
    return Response.json({ aviso });
  } catch (e) {
    return respuestaError(e);
  }
}
