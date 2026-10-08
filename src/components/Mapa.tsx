import { urlMapa, urlMapaIncrustado } from "@/lib/mapa";

/** Icono de chincheta para enlaces a mapas. */
export function IconoMapa({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/** Icono de ojo para "ver detalle". */
export function IconoOjo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Enlace "ver en Google Maps" (nueva pestaña). */
export function EnlaceMapa({ direccion, texto = "Ver en el mapa", soloIcono = false }: { direccion: string; texto?: string; soloIcono?: boolean }) {
  return (
    <a
      href={urlMapa(direccion)}
      target="_blank"
      rel="noopener noreferrer"
      title={`Abrir "${direccion}" en Google Maps`}
      aria-label={`Abrir ${direccion} en Google Maps`}
      className={
        soloIcono
          ? "inline-flex h-8 w-8 items-center justify-center rounded-lg text-fj-muted hover:bg-fj-navy-soft hover:text-fj-navy"
          : "inline-flex items-center gap-1.5 rounded-lg border border-fj-border bg-fj-surface px-3 py-1.5 text-sm font-medium text-fj-navy hover:border-fj-border-hi"
      }
    >
      <IconoMapa />
      {!soloIcono && texto}
    </a>
  );
}

/** Mapa incrustado de Google Maps (sin clave de API). */
export function MapaIncrustado({ direccion, alto = 260 }: { direccion: string; alto?: number }) {
  return (
    <iframe
      title={`Mapa de ${direccion}`}
      src={urlMapaIncrustado(direccion)}
      width="100%"
      height={alto}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className="block rounded-lg border border-fj-border"
    />
  );
}
