import { exigirUsuario } from "@/lib/acceso";
import { respuestaError } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Agente de voz de la demo (kit §3.3). Se puede cambiar por variable de entorno. */
const AGENTE_POR_DEFECTO = "agent_393856d064480bc2669886d61e";

/**
 * POST /api/voz: crea una llamada web en Retell para probar el asistente desde el navegador.
 *
 * La clave de Retell (`RETELL_API_KEY`) vive solo en el servidor. Retell devuelve un `access_token`
 * de un solo uso y corta caducidad que el navegador usa para conectar el micrófono con el agente.
 * La llamada pasa por el mismo webhook de n8n que una llamada de teléfono, así que el aviso aparece
 * en la bandeja igual. Nadie del cliente toca Retell ni ve ninguna credencial.
 */
export async function POST() {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;

  const clave = process.env.RETELL_API_KEY;
  if (!clave) return Response.json({ error: "La llamada por navegador no está activada (falta RETELL_API_KEY)" }, { status: 503 });
  const agente = process.env.RETELL_AGENT_ID || AGENTE_POR_DEFECTO;

  try {
    const r = await fetch("https://api.retellai.com/v3/create-web-call", {
      method: "POST",
      headers: { Authorization: `Bearer ${clave}`, "content-type": "application/json" },
      body: JSON.stringify({
        agent_id: agente,
        metadata: { origen: "panel", usuario: acceso.usuario.nombre },
      }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (!r.ok) {
      const detalle = await r.text().catch(() => "");
      console.error("[voz] Retell", r.status, detalle.slice(0, 300));
      return Response.json({ error: `Retell no ha podido crear la llamada (${r.status})` }, { status: 502 });
    }
    const j = (await r.json()) as {
      call_id: string;
      access_token: string;
      transport?: string;
      ice_servers?: unknown[];
      expires_at?: number;
    };
    return Response.json({
      call_id: j.call_id,
      access_token: j.access_token,
      transport: j.transport ?? "gateway",
      ice_servers: j.ice_servers ?? [],
      expires_at: j.expires_at ?? null,
    });
  } catch (e) {
    return respuestaError(e, 504);
  }
}
