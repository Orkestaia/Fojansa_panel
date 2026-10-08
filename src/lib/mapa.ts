/**
 * Enlaces a Google Maps sin clave de API: búsqueda (nueva pestaña) y mapa incrustado (iframe).
 * Las direcciones de los avisos vienen sin ciudad: se añade Vitoria-Gasteiz si no la lleva.
 */

const CIUDAD = "Vitoria-Gasteiz";

export function direccionCompleta(direccion: string): string {
  const d = direccion.trim();
  return /vitoria|gasteiz|álava|alava|araba/i.test(d) ? d : `${d}, ${CIUDAD}`;
}

export function urlMapa(direccion: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionCompleta(direccion))}`;
}

export function urlMapaIncrustado(direccion: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(direccionCompleta(direccion))}&z=16&output=embed`;
}
