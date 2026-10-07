import { exigirUsuario } from "@/lib/acceso";
import { leerCuerpo, respuestaError } from "@/lib/api";
import { actualizarParte, obtenerParte, type CambiosParte } from "@/lib/datos/partes";
import { EsquemaParte } from "@/lib/esquemas";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  try {
    const parte = await obtenerParte((await ctx.params).id);
    if (!parte) return Response.json({ error: "No existe" }, { status: 404 });
    return Response.json({ parte });
  } catch (e) {
    return respuestaError(e);
  }
}

function aNumero(v: number | string | null | undefined): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * PATCH /api/partes/:id (spec §3): validar / corregir / descartar guardan `revisado_por` (usuario
 * con sesión) y `revisado_at`. Volver a pendiente los limpia. La corrección también guarda los campos.
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  const cuerpo = await leerCuerpo(req, EsquemaParte);
  if ("error" in cuerpo) return cuerpo.error;
  try {
    const d = cuerpo.datos;
    const cambios: CambiosParte = {
      ...d,
      cantidad: aNumero(d.cantidad),
      horas: aNumero(d.horas),
    };
    if (d.estado) {
      if (d.estado === "pendiente_revision") {
        cambios.revisado_por = null;
        cambios.revisado_at = null;
      } else {
        cambios.revisado_por = acceso.usuario.nombre;
        cambios.revisado_at = new Date().toISOString();
        if (d.estado === "validado" || d.estado === "corregido") cambios.motivo_revisar = null;
      }
    }
    // Quitar claves undefined para no mandar nulls por accidente.
    const limpio = Object.fromEntries(Object.entries(cambios).filter(([, v]) => v !== undefined)) as CambiosParte;
    if (Object.keys(limpio).length === 0) return Response.json({ error: "Nada que cambiar" }, { status: 400 });
    return Response.json({ parte: await actualizarParte((await ctx.params).id, limpio) });
  } catch (e) {
    return respuestaError(e);
  }
}
