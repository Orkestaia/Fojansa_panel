import { exigirUsuario } from "@/lib/acceso";
import { respuestaError } from "@/lib/api";
import { listarPartes, resumirPorObra } from "@/lib/datos/partes";
import { ESTADOS_PARTE, type EstadoParte } from "@/lib/tipos";

export const dynamic = "force-dynamic";

/** GET /api/partes?obra=&estado=&desde=&hasta=&q= → partes + resumen por obra. */
export async function GET(req: Request) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  try {
    const p = new URL(req.url).searchParams;
    const estado = p.get("estado");
    const partes = await listarPartes({
      obra: p.get("obra") ?? undefined,
      estado: (ESTADOS_PARTE as readonly string[]).includes(estado ?? "") ? (estado as EstadoParte) : undefined,
      desde: p.get("desde") ?? undefined,
      hasta: p.get("hasta") ?? undefined,
      q: p.get("q") ?? undefined,
    });
    return Response.json({ partes, resumen: resumirPorObra(partes) });
  } catch (e) {
    return respuestaError(e);
  }
}
