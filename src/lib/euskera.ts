/**
 * Búsqueda tolerante a euskera (spec §2.7).
 *
 * Muchas calles y apellidos de Vitoria se escriben en euskera (Goikoetxea, Zabalgana, Txagorritxu)
 * y oficina los teclea a oído. Se normaliza SIN tildes, en minúsculas y, además, se equiparan las
 * grafías que suenan igual: tx↔ch, tz↔ts, k↔c/qu, z↔s, b↔v. La función se aplica a los dos lados
 * (lo que teclea el usuario y el valor guardado), así que basta con que ambos caigan en la misma
 * forma canónica. Se muestra siempre la grafía original: esto solo sirve para comparar.
 */

/** Quita tildes y diéresis, pasa a minúsculas y compacta espacios. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

// Marcador interno para que la "c" de "ch" no se convierta en "k" en el paso siguiente.
const CH = "ĉ"; // ĉ

/**
 * Forma canónica para comparar: tras normalizar, lleva cada par de grafías equivalentes a una
 * sola. El orden importa: primero los dígrafos (tx, ch, tz, qu) y después las letras sueltas.
 */
export function normalizarEuskera(texto: string): string {
  return (
    normalizarTexto(texto)
      // dígrafos
      .replace(/tx|ch/g, CH)
      .replace(/tz/g, "ts")
      .replace(/qu/g, "k")
      // "c" suena /k/ salvo delante de e/i, donde suena /z|s/
      .replace(/c([ei])/g, "s$1")
      .replace(/c/g, "k")
      .replace(/z/g, "s")
      .replace(/v/g, "b")
      // la h muda no se pronuncia (Herrán / Erran); la de "ch" ya va dentro del marcador
      .replace(/h/g, "")
      .replace(new RegExp(CH, "g"), "ch")
  );
}

/** true si todas las palabras de la consulta aparecen (en forma canónica) en el valor. */
export function coincideEuskera(consulta: string, valor: string | null | undefined): boolean {
  if (!valor) return false;
  const q = normalizarEuskera(consulta);
  if (!q) return true;
  const v = normalizarEuskera(valor);
  return q.split(" ").every((palabra) => v.includes(palabra));
}

/** Filtra una lista por varios campos a la vez. */
export function filtrarPorTexto<T>(
  elementos: T[],
  consulta: string | null | undefined,
  campos: (e: T) => Array<string | null | undefined>,
): T[] {
  if (!consulta || !normalizarEuskera(consulta)) return elementos;
  return elementos.filter((e) => coincideEuskera(consulta, campos(e).filter(Boolean).join(" · ")));
}
