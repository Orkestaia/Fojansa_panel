import { z } from "zod";
import { exigirUsuario } from "@/lib/acceso";
import { leerCuerpo, respuestaError } from "@/lib/api";
import { registrarCosteIa } from "@/lib/datos/costes";
import { EsquemaCosteIa } from "@/lib/esquemas";

export const dynamic = "force-dynamic";

const Entrada = z.object({
  session_id: z.string().min(8).max(100),
  texto: z.string().trim().min(1).max(2000),
  nombre: z.string().trim().max(100).optional(),
});

const Salida = z.object({
  respuesta: z.string(),
  session_id: z.string().optional(),
  aviso_registrado: z.boolean().optional(),
  /** Opcional: consumo de la respuesta. Si n8n lo manda, se guarda en fojansa_costes_ia. */
  uso: EsquemaCosteIa.optional(),
});

/**
 * POST /api/chat (spec §2.6 y §3): reenvía al webhook de n8n "Fojansa DEMO · Avisos por chat".
 * La URL y el token (si lo hay) viven en variables de entorno; el navegador nunca los ve.
 */
export async function POST(req: Request) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  const cuerpo = await leerCuerpo(req, Entrada);
  if ("error" in cuerpo) return cuerpo.error;

  const url = process.env.N8N_CHAT_WEBHOOK_URL;
  if (!url) return Response.json({ error: "Chat no configurado (N8N_CHAT_WEBHOOK_URL)" }, { status: 503 });

  const cabeceras: Record<string, string> = { "content-type": "application/json" };
  if (process.env.N8N_CHAT_TOKEN) cabeceras["x-orkesta-token"] = process.env.N8N_CHAT_TOKEN;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: cabeceras,
      body: JSON.stringify({
        session_id: cuerpo.datos.session_id,
        texto: cuerpo.datos.texto,
        nombre: cuerpo.datos.nombre || acceso.usuario.nombre,
      }),
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
    });
    if (!r.ok) return Response.json({ error: `El asistente no responde (${r.status})` }, { status: 502 });
    const json = Salida.safeParse(await r.json());
    if (!json.success) return Response.json({ error: "Respuesta del asistente no reconocida" }, { status: 502 });

    // Consumo de la respuesta (si n8n lo incluye). Nunca bloquea la respuesta al usuario.
    if (json.data.uso) {
      registrarCosteIa({ canal: "web", origen: "chat", session_id: cuerpo.datos.session_id, ...json.data.uso }).catch((e) =>
        console.error("[chat] coste IA:", e instanceof Error ? e.message : e),
      );
    }

    return Response.json({
      respuesta: json.data.respuesta,
      session_id: json.data.session_id ?? cuerpo.datos.session_id,
      aviso_registrado: json.data.aviso_registrado ?? false,
    });
  } catch (e) {
    return respuestaError(e, 504);
  }
}
