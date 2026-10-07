import { normalizarTexto } from "./euskera";

/**
 * Lector de CSV para la importación de comunidades (spec §2.4). Sin dependencias: Go!Manage
 * exporta con `;` o `,`, a veces con BOM y con campos entre comillas. Admite ambos separadores.
 */

export function detectarSeparador(primeraLinea: string): string {
  const candidatos = [";", ",", "\t"];
  let mejor = ";";
  let max = -1;
  for (const c of candidatos) {
    const n = primeraLinea.split(c).length - 1;
    if (n > max) {
      max = n;
      mejor = c;
    }
  }
  return mejor;
}

/** Parte el texto en filas de celdas respetando comillas dobles ("" = comilla literal). */
export function parsearCsv(texto: string, separador?: string): string[][] {
  const limpio = texto.replace(/^﻿/, "");
  const sep = separador ?? detectarSeparador(limpio.split(/\r?\n/, 1)[0] ?? "");
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let enComillas = false;

  for (let i = 0; i < limpio.length; i++) {
    const ch = limpio[i];
    if (enComillas) {
      if (ch === '"') {
        if (limpio[i + 1] === '"') {
          celda += '"';
          i++;
        } else {
          enComillas = false;
        }
      } else {
        celda += ch;
      }
      continue;
    }
    if (ch === '"') {
      enComillas = true;
    } else if (ch === sep) {
      fila.push(celda);
      celda = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && limpio[i + 1] === "\n") i++;
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else {
      celda += ch;
    }
  }
  if (celda.length > 0 || fila.length > 0) {
    fila.push(celda);
    filas.push(fila);
  }
  // Filas totalmente vacías fuera.
  return filas.filter((f) => f.some((c) => c.trim() !== ""));
}

/** "sí", "si", "1", "true", "x", "verdadero" → true; "no", "0", "false", "" → false. */
export function aBooleano(valor: string | undefined, porDefecto = true): boolean {
  if (valor === undefined) return porDefecto;
  const v = normalizarTexto(valor);
  if (v === "") return porDefecto;
  if (["si", "s", "1", "true", "x", "verdadero", "vigente", "al dia", "ok"].includes(v)) return true;
  if (["no", "n", "0", "false", "falso", "pendiente", "vencido", "baja"].includes(v)) return false;
  return porDefecto;
}

export interface ComunidadImportada {
  direccion: string;
  nombre: string | null;
  administrador: string | null;
  contrato_vigente: boolean;
  pagos_al_dia: boolean;
  tipo_instalacion: string | null;
  notas: string | null;
}

export interface ResultadoLectura {
  comunidades: ComunidadImportada[];
  /** Filas descartadas con su motivo (1-based, contando la cabecera como 1). */
  descartadas: Array<{ fila: number; motivo: string }>;
  columnas: string[];
}

/** Alias que aceptamos para cada columna (Go!Manage no exporta con nuestros nombres). */
const ALIAS: Record<keyof ComunidadImportada, string[]> = {
  direccion: ["direccion", "dirección", "domicilio", "calle", "direccion comunidad"],
  nombre: ["nombre", "comunidad", "denominacion", "razon social", "cliente"],
  administrador: ["administrador", "administracion", "administración", "gestor", "fincas"],
  contrato_vigente: ["contrato_vigente", "contrato vigente", "contrato", "vigente", "mantenimiento"],
  pagos_al_dia: ["pagos_al_dia", "pagos al dia", "pagos", "al dia", "cobros", "pagado"],
  tipo_instalacion: ["tipo_instalacion", "tipo instalacion", "instalacion", "tipo"],
  notas: ["notas", "observaciones", "comentarios"],
};

function indiceColumna(cabecera: string[], campo: keyof ComunidadImportada): number {
  const normalizadas = cabecera.map((c) => normalizarTexto(c));
  for (const alias of ALIAS[campo]) {
    const i = normalizadas.indexOf(normalizarTexto(alias));
    if (i >= 0) return i;
  }
  return -1;
}

export function leerComunidadesCsv(texto: string): ResultadoLectura {
  const filas = parsearCsv(texto);
  if (filas.length === 0) return { comunidades: [], descartadas: [], columnas: [] };
  const cabecera = filas[0].map((c) => c.trim());
  const idx = Object.fromEntries(
    (Object.keys(ALIAS) as Array<keyof ComunidadImportada>).map((k) => [k, indiceColumna(cabecera, k)]),
  ) as Record<keyof ComunidadImportada, number>;

  if (idx.direccion < 0) {
    return {
      comunidades: [],
      descartadas: [{ fila: 1, motivo: 'Falta la columna "direccion"' }],
      columnas: cabecera,
    };
  }

  const comunidades: ComunidadImportada[] = [];
  const descartadas: ResultadoLectura["descartadas"] = [];
  const vistas = new Set<string>();
  const celda = (fila: string[], i: number) => (i >= 0 ? (fila[i] ?? "").trim() : undefined);

  filas.slice(1).forEach((fila, n) => {
    const numFila = n + 2;
    const direccion = celda(fila, idx.direccion);
    if (!direccion) {
      descartadas.push({ fila: numFila, motivo: "Sin dirección" });
      return;
    }
    const clave = normalizarTexto(direccion);
    if (vistas.has(clave)) {
      descartadas.push({ fila: numFila, motivo: `Dirección repetida: ${direccion}` });
      return;
    }
    vistas.add(clave);
    comunidades.push({
      direccion,
      nombre: celda(fila, idx.nombre) || null,
      administrador: celda(fila, idx.administrador) || null,
      contrato_vigente: aBooleano(celda(fila, idx.contrato_vigente), true),
      pagos_al_dia: aBooleano(celda(fila, idx.pagos_al_dia), true),
      tipo_instalacion: celda(fila, idx.tipo_instalacion) || null,
      notas: celda(fila, idx.notas) || null,
    });
  });

  return { comunidades, descartadas, columnas: cabecera };
}
