import "server-only";
import type { ZodType } from "zod";

/** Utilidades comunes de las route handlers. */

export function respuestaError(e: unknown, estado = 500): Response {
  const mensaje = e instanceof Error ? e.message : "Error inesperado";
  console.error("[api]", mensaje);
  return Response.json({ error: mensaje }, { status: estado });
}

/** Lee y valida el JSON del cuerpo. Devuelve la respuesta 400 si no cuadra. */
export async function leerCuerpo<T>(req: Request, esquema: ZodType<T>): Promise<{ datos: T } | { error: Response }> {
  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return { error: Response.json({ error: "Cuerpo JSON inválido" }, { status: 400 }) };
  }
  const r = esquema.safeParse(cuerpo);
  if (!r.success) {
    return { error: Response.json({ error: "Datos no válidos", detalle: r.error.issues }, { status: 400 }) };
  }
  return { datos: r.data };
}

/** "1", "true", "sí" → true; "0", "false", "no" → false; otra cosa → undefined. */
export function parametroBooleano(v: string | null): boolean | undefined {
  if (v === null || v === "") return undefined;
  if (["1", "true", "si", "sí"].includes(v.toLowerCase())) return true;
  if (["0", "false", "no"].includes(v.toLowerCase())) return false;
  return undefined;
}
