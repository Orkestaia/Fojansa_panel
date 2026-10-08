import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { clerkActivo, modoDesarrolloSinClerk, usuarioActual } from "@/lib/acceso";
import { MenuUsuarioClerk, MenuUsuarioLocal } from "@/components/MenuUsuario";
import { NavEnlaces } from "@/components/NavEnlaces";
import { TourLocal } from "@/components/Tour";
import { TourClerk } from "@/components/TourClerk";

export const dynamic = "force-dynamic";

/**
 * Cascarón del panel: cabecera con el logo de Fojansa, navegación y usuario; pie "con tecnología
 * de Orkesta" (spec §1). Comprueba la sesión en el servidor además del middleware.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioActual();

  if (!usuario) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <Image src="/fojansa-logo.png" alt="Instalaciones Fojansa" width={160} height={57} />
        <p className="text-fj-text">
          {clerkActivo() ? "Esta cuenta no tiene acceso al panel." : "El panel no está configurado (faltan las claves de acceso)."}
        </p>
        {clerkActivo() ? (
          <SignOutButton>
            <button className="rounded-lg border border-fj-border-hi px-4 py-2 text-sm text-fj-navy">Salir</button>
          </SignOutButton>
        ) : (
          <Link href="/sign-in" className="text-sm text-fj-navy underline">
            Ir al acceso
          </Link>
        )}
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-fj-border bg-fj-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 sm:px-6">
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/" aria-label="Inicio">
              <Image src="/fojansa-logo.png" alt="Instalaciones Fojansa" width={124} height={44} priority className="h-9 w-auto" />
            </Link>
            {/* Rótulo, no botón: nombra la aplicación. */}
            <span className="hidden border-l border-fj-border pl-3 text-xs font-medium uppercase tracking-wide text-fj-faint md:inline">
              Panel de avisos
            </span>
          </div>
          {/* En pantallas estrechas (tablet) la navegación baja a una segunda fila en vez de recortarse. */}
          <div className="order-last w-full pb-1 xl:order-none xl:w-auto xl:flex-1 xl:pb-0" data-tour="nav">
            <NavEnlaces />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-fj-muted sm:inline">{usuario.nombre}</span>
            {clerkActivo() ? (
              <MenuUsuarioClerk />
            ) : (
              <>
                {modoDesarrolloSinClerk() && (
                  <span className="rounded-full bg-fj-warn-soft px-2 py-0.5 text-xs font-medium text-fj-warn" title="Sin Clerk: solo en desarrollo">
                    Desarrollo
                  </span>
                )}
                <MenuUsuarioLocal nombre={usuario.nombre} />
              </>
            )}
          </div>
        </div>
      </header>
      {/* Tour de bienvenida: la primera vez arranca solo; después, desde el menú del usuario. */}
      {clerkActivo() ? <TourClerk /> : <TourLocal />}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      <footer className="border-t border-fj-border py-4 text-center text-xs text-fj-faint">
        Instalaciones Fojansa · con tecnología de Orkesta
      </footer>
    </div>
  );
}
