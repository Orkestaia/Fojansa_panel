import { exigirUsuario } from "@/lib/acceso";
import { leerCuerpo, respuestaError } from "@/lib/api";
import { actualizarComunidad, obtenerComunidad } from "@/lib/datos/comunidades";
import { EsquemaComunidad } from "@/lib/esquemas";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  try {
    const comunidad = await obtenerComunidad((await ctx.params).id);
    if (!comunidad) return Response.json({ error: "No existe" }, { status: 404 });
    return Response.json({ comunidad });
  } catch (e) {
    return respuestaError(e);
  }
}

/** PATCH /api/comunidades/:id: edición inline. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  const cuerpo = await leerCuerpo(req, EsquemaComunidad);
  if ("error" in cuerpo) return cuerpo.error;
  try {
    return Response.json({ comunidad: await actualizarComunidad((await ctx.params).id, cuerpo.datos) });
  } catch (e) {
    return respuestaError(e);
  }
}
