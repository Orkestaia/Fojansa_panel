"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { EVENTO_TOUR } from "@/lib/tour";

function IconoLibro() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconoRuta() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  );
}

function lanzarTour() {
  window.dispatchEvent(new CustomEvent(EVENTO_TOUR));
}

/** Menú del usuario con Clerk: avatar + "Guía de usuario" + "Ver el tour otra vez" + salir. */
export function MenuUsuarioClerk() {
  return (
    <span data-tour="menu-usuario" className="inline-flex">
      <UserButton>
        <UserButton.MenuItems>
          <UserButton.Link label="Guía de usuario" labelIcon={<IconoLibro />} href="/guia" />
          <UserButton.Action label="Ver el tour otra vez" labelIcon={<IconoRuta />} onClick={lanzarTour} />
        </UserButton.MenuItems>
      </UserButton>
    </span>
  );
}

/** Menú equivalente sin Clerk (desarrollo). */
export function MenuUsuarioLocal({ nombre }: { nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [abierto]);
  return (
    <div ref={ref} className="relative" data-tour="menu-usuario">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-fj-navy text-sm font-semibold text-white"
        title={nombre}
      >
        {nombre.slice(0, 1).toUpperCase()}
      </button>
      {abierto && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-fj-border bg-fj-surface py-1 shadow-lg">
          <Link role="menuitem" href="/guia" onClick={() => setAbierto(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-fj-text hover:bg-fj-surface-2">
            <IconoLibro /> Guía de usuario
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setAbierto(false);
              lanzarTour();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fj-text hover:bg-fj-surface-2"
          >
            <IconoRuta /> Ver el tour otra vez
          </button>
        </div>
      )}
    </div>
  );
}
