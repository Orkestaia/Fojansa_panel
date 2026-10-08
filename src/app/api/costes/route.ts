import { exigirTokenApi, usuarioActual } from "@/lib/acceso";
import { leerCuerpo, respuestaError } from "@/lib/api";
import { registrarCosteIa } from "@/lib/datos/costes";
import { EsquemaCosteIa } from "@/lib/esquemas";

export const dynamic = "force-dynamic";

/**
 * POST /api/costes: registra el consumo de una respuesta de IA (chat de Telegram, partes, etc.).
 * Lo llama n8n con `Authorization: Bearer FOJANSA_API_TOKEN` (está fuera del middleware de Clerk);
 * también vale con sesión del panel. Si no trae `coste_eur` pero sí modelo y tokens, se estima.
 *
 * Cuerpo: { canal?, origen?, session_id?, aviso_id?, proveedor?, modelo?, tokens_entrada?, tokens_salida?, coste_eur?, raw? }
 */
export async function POST(req: Request) {
  const usuario = await usuarioActual();
  if (!usuario) {
    const sinToken = exigirTokenApi(req);
    if (sinToken) return sinToken;
  }
  const cuerpo = await leerCuerpo(req, EsquemaCosteIa);
  if ("error" in cuerpo) return cuerpo.error;
  try {
    return Response.json({ coste: await registrarCosteIa(cuerpo.datos) }, { status: 201 });
  } catch (e) {
    return respuestaError(e);
  }
}
