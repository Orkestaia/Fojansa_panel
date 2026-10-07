import { exigirTokenApi, usuarioActual } from "@/lib/acceso";
import { respuestaError } from "@/lib/api";
import { vincularAvisosSinContacto } from "@/lib/datos/avisos";

export const dynamic = "force-dynamic";

/**
 * POST /api/avisos/vincular (spec §2.3 y §3): crea o enlaza el contacto de cada aviso sin
 * `contacto_id`. Lo puede llamar n8n tras guardar un aviso (Bearer `FOJANSA_API_TOKEN`) o el
 * propio panel con sesión. Está fuera del middleware de Clerk: aquí se exige una de las dos.
 */
export async function POST(req: Request) {
  const usuario = await usuarioActual();
  if (!usuario) {
    const sinToken = exigirTokenApi(req);
    if (sinToken) return sinToken;
  }
  try {
    return Response.json(await vincularAvisosSinContacto());
  } catch (e) {
    return respuestaError(e);
  }
}
