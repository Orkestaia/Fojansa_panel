import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

/**
 * Todo el panel va detrás de Clerk (spec §3) salvo:
 * - `/sign-in`: el propio login.
 * - `/api/avisos/vincular` y `/api/costes`: las llama n8n sin navegador; validan el Bearer
 *   `FOJANSA_API_TOKEN` dentro de la ruta (`src/lib/acceso.ts`).
 * - `/api/salud`: comprobación de vida para Docker.
 *
 * Sin claves de Clerk: en desarrollo se deja pasar (usuario "Desarrollo", ver `acceso.ts`);
 * en producción las páginas y APIs rechazan por su cuenta porque `usuarioActual()` devuelve null.
 */
const esPublica = createRouteMatcher(["/sign-in(.*)", "/api/avisos/vincular", "/api/costes", "/api/salud"]);

const clerkActivo = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

const conClerk = clerkMiddleware(async (auth, req) => {
  if (!esPublica(req)) await auth.protect();
});

export default function middleware(req: NextRequest, ev: NextFetchEvent) {
  if (clerkActivo) return conClerk(req, ev);
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todo menos estáticos e imágenes.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
