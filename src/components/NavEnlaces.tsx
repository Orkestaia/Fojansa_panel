"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ENLACES = [
  { href: "/", texto: "Inicio" },
  { href: "/avisos", texto: "Avisos" },
  { href: "/contactos", texto: "Contactos" },
  { href: "/comunidades", texto: "Comunidades" },
  { href: "/partes", texto: "Partes" },
  { href: "/chat", texto: "Probar el asistente" },
];

export function NavEnlaces() {
  const ruta = usePathname();
  return (
    <nav aria-label="Secciones" className="-mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
      {ENLACES.map((e) => {
        const activo = e.href === "/" ? ruta === "/" : ruta.startsWith(e.href);
        return (
          <Link
            key={e.href}
            href={e.href}
            aria-current={activo ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activo ? "bg-fj-navy-soft text-fj-navy" : "text-fj-muted hover:bg-fj-surface-2 hover:text-fj-navy"
            }`}
          >
            {e.texto}
          </Link>
        );
      })}
    </nav>
  );
}
