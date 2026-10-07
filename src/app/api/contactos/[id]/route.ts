import { exigirUsuario } from "@/lib/acceso";
import { leerCuerpo, respuestaError } from "@/lib/api";
import { actualizarContacto, avisosDelContacto, obtenerContacto } from "@/lib/datos/contactos";
import { EsquemaContacto } from "@/lib/esquemas";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  try {
    const { id } = await ctx.params;
    const contacto = await obtenerContacto(id);
    if (!contacto) return Response.json({ error: "No existe" }, { status: 404 });
    return Response.json({ contacto, avisos: await avisosDelContacto(id) });
  } catch (e) {
    return respuestaError(e);
  }
}

/** PATCH /api/contactos/:id: datos editables de la ficha. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  const cuerpo = await leerCuerpo(req, EsquemaContacto);
  if ("error" in cuerpo) return cuerpo.error;
  try {
    return Response.json({ contacto: await actualizarContacto((await ctx.params).id, cuerpo.datos) });
  } catch (e) {
    return respuestaError(e);
  }
}
