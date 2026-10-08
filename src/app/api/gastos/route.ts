import { exigirUsuario } from "@/lib/acceso";
import { respuestaError } from "@/lib/api";
import { obtenerGastos } from "@/lib/datos/costes";
import { esPeriodo } from "@/lib/fechas";

export const dynamic = "force-dynamic";

/** GET /api/gastos?periodo=hoy|7d|30d|temporada → resumen de gastos del agente (voz + IA). */
export async function GET(req: Request) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  try {
    const periodo = new URL(req.url).searchParams.get("periodo");
    return Response.json(await obtenerGastos(esPeriodo(periodo) ? periodo : "30d"));
  } catch (e) {
    return respuestaError(e);
  }
}
