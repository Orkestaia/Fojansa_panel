import "server-only";
import { timingSafeEqual } from "node:crypto";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Acceso al panel (spec §1: Clerk, dos usuarios de demo, rol único).
 *
 * - `clerkActivo()`: hay claves de Clerk. Sin ellas, en desarrollo el panel abre sin login con un
 *   usuario ficticio "Desarrollo" (para construir y probar sin cuenta); en producción todo se
 *   rechaza. Nunca hay un "modo sin login" en producción.
 * - `PANEL_EMAILS_PERMITIDOS` (opcional, separados por comas): si está, además de la sesión se
 *   exige que el email verificado esté en la lista. Vacía = cualquier usuario de la instancia de
 *   Clerk entra (la instancia tiene el registro cerrado y los usuarios los crea Orkesta).
 */

export interface Usuario {
  /** Nombre para mostrar y para `pasado_por` / `revisado_por`. */
  nombre: string;
  email: string | null;
}

export function clerkActivo(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

export function modoDesarrolloSinClerk(): boolean {
  return !clerkActivo() && process.env.NODE_ENV === "development";
}

function emailsPermitidos(): string[] {
  return (process.env.PANEL_EMAILS_PERMITIDOS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** El usuario con sesión, o null si no la hay o no está permitido. */
export async function usuarioActual(): Promise<Usuario | null> {
  if (modoDesarrolloSinClerk()) return { nombre: "Desarrollo", email: null };
  if (!clerkActivo()) return null;
  const u = await currentUser();
  if (!u) return null;
  const principal = u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId);
  const email = principal?.emailAddress.toLowerCase() ?? null;
  const lista = emailsPermitidos();
  if (lista.length > 0) {
    if (!email || principal?.verification?.status !== "verified" || !lista.includes(email)) return null;
  }
  const nombre =
    [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.username || email || "Usuario";
  return { nombre, email };
}

/** Para las rutas de API: devuelve el usuario o la respuesta de error (401). */
export async function exigirUsuario(): Promise<{ usuario: Usuario } | { error: Response }> {
  const usuario = await usuarioActual();
  if (usuario) return { usuario };
  return { error: Response.json({ error: "Sin acceso" }, { status: 401 }) };
}

/**
 * Para rutas que llama n8n sin sesión de navegador (`POST /api/avisos/vincular`):
 * `Authorization: Bearer <FOJANSA_API_TOKEN>`. Comparación en tiempo constante; sin token
 * configurado (o corto) todo se rechaza.
 */
export function exigirTokenApi(req: Request): Response | null {
  const esperado = process.env.FOJANSA_API_TOKEN;
  const recibido = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (esperado && esperado.length >= 32) {
    const a = Buffer.from(recibido);
    const b = Buffer.from(esperado);
    if (a.length === b.length && timingSafeEqual(a, b)) return null;
  }
  return Response.json({ error: "No autorizado" }, { status: 401 });
}
