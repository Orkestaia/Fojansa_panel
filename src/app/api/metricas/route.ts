import { exigirUsuario } from "@/lib/acceso";
import { respuestaError } from "@/lib/api";
import { obtenerMetricas } from "@/lib/datos/metricas";
import { esPeriodo } from "@/lib/fechas";

export const dynamic = "force-dynamic";

/** GET /api/metricas?periodo=hoy|7d|30d|temporada (spec §3). */
export async function GET(req: Request) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  try {
    const periodo = new URL(req.url).searchParams.get("periodo");
    return Response.json(await obtenerMetricas(esPeriodo(periodo) ? periodo : "hoy"));
  } catch (e) {
    return respuestaError(e);
  }
}
