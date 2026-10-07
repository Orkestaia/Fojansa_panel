import { exigirUsuario } from "@/lib/acceso";
import { parametroBooleano, respuestaError } from "@/lib/api";
import { listarAvisos } from "@/lib/datos/avisos";
import { CANALES_AVISO, ESTADOS_AVISO, TIPOS_AVISO, type CanalAviso, type EstadoAviso, type TipoAviso } from "@/lib/tipos";

export const dynamic = "force-dynamic";

/** GET /api/avisos?estado=&canal=&tipo=&urgente=&q=&desde=&hasta= (spec §3). */
export async function GET(req: Request) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  try {
    const p = new URL(req.url).searchParams;
    const estado = p.get("estado");
    const canal = p.get("canal");
    const tipo = p.get("tipo");
    const desde = p.get("desde");
    const hasta = p.get("hasta");
    const avisos = await listarAvisos({
      estado: estado === "abiertos" || (ESTADOS_AVISO as readonly string[]).includes(estado ?? "") ? (estado as EstadoAviso | "abiertos") : undefined,
      canal: canal === "chat" || (CANALES_AVISO as readonly string[]).includes(canal ?? "") ? (canal as CanalAviso | "chat") : undefined,
      tipo: (TIPOS_AVISO as readonly string[]).includes(tipo ?? "") ? (tipo as TipoAviso) : undefined,
      urgente: parametroBooleano(p.get("urgente")),
      q: p.get("q") ?? undefined,
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
      limite: Number(p.get("limite")) || undefined,
    });
    return Response.json({ avisos });
  } catch (e) {
    return respuestaError(e);
  }
}
