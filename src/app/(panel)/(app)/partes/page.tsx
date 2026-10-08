import Link from "next/link";
import { listarObras, listarPartes, resumirPorObra, type FiltrosPartes } from "@/lib/datos/partes";
import { ETIQUETA_ESTADO_PARTE, ETIQUETA_IDIOMA } from "@/lib/etiquetas";
import { formatearFecha } from "@/lib/fechas";
import { ESTADOS_PARTE, numero, type EstadoParte } from "@/lib/tipos";
import { InsigniaEstadoParte, Tarjeta, Titulo, Vacio } from "@/components/ui";
import { BuscadorSimple } from "@/components/BuscadorSimple";
import { IconoOjo } from "@/components/Mapa";
import { Refresco } from "@/components/Refresco";

export const metadata = { title: "Partes" };

type SP = { q?: string; obra?: string; estado?: string; desde?: string; hasta?: string };

/** Partes de trabajo por audio (spec §2.5): tabla, filtro por obra y fecha, resumen por obra. */
export default async function PaginaPartes({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f: FiltrosPartes = { q: sp.q, obra: sp.obra || undefined };
  if ((ESTADOS_PARTE as readonly string[]).includes(sp.estado ?? "")) f.estado = sp.estado as EstadoParte;
  if (sp.desde && /^\d{4}-\d{2}-\d{2}$/.test(sp.desde)) f.desde = sp.desde;
  if (sp.hasta && /^\d{4}-\d{2}-\d{2}$/.test(sp.hasta)) f.hasta = sp.hasta;

  const [partes, obras] = await Promise.all([listarPartes(f), listarObras()]);
  const resumen = resumirPorObra(partes);

  return (
    <>
      <Refresco segundos={15} />
      <Titulo sub="Notas de voz de los operarios, en su idioma, convertidas en partes en español. El jefe de obra valida, corrige o descarta.">
        Partes
      </Titulo>
      <BuscadorSimple
        placeholder="Buscar operario, obra, trabajo…"
        filtros={[
          { clave: "obra", etiqueta: "Obra", opciones: obras.map((o) => ({ valor: o, texto: o })) },
          { clave: "estado", etiqueta: "Estado", opciones: ESTADOS_PARTE.map((e) => ({ valor: e, texto: ETIQUETA_ESTADO_PARTE[e] })) },
        ]}
      />

      {resumen.length > 0 && (
        <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen por obra" data-tour="partes-resumen">
          {resumen.map((r) => (
            <Link key={r.obra} href={`/partes?obra=${encodeURIComponent(r.obra)}`} className="block rounded-xl border border-fj-border bg-fj-surface p-4 hover:border-fj-border-hi">
              <p className="truncate text-sm font-semibold text-fj-navy" title={r.obra}>
                {r.obra}
              </p>
              <p className="mt-1 text-xs text-fj-muted">
                {r.partes} {r.partes === 1 ? "parte" : "partes"}
                {r.pendientes > 0 && <span className="text-fj-warn"> · {r.pendientes} por revisar</span>}
              </p>
              <p className="tabular mt-2 text-2xl font-semibold text-fj-text">
                {r.horas} <span className="text-sm font-normal text-fj-muted">h</span>
              </p>
              {r.unidades.length > 0 && (
                <p className="tabular mt-1 text-xs text-fj-muted">{r.unidades.map((u) => `${u.cantidad} ${u.unidad}`).join(" · ")}</p>
              )}
            </Link>
          ))}
        </section>
      )}

      <Tarjeta className="mt-4 overflow-hidden">
        {partes.length === 0 ? (
          <Vacio>No hay partes {Object.values(sp).some(Boolean) ? "con estos filtros" : "todavía"}. Llegan solos con cada nota de voz del bot.</Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-fj-surface-2 text-left text-xs font-medium uppercase tracking-wide text-fj-faint">
                <tr>
                  <th className="px-4 py-2.5">Fecha</th>
                  <th className="px-3 py-2.5">Operario</th>
                  <th className="px-3 py-2.5">Obra</th>
                  <th className="px-3 py-2.5">Partida</th>
                  <th className="px-3 py-2.5">Trabajo</th>
                  <th className="px-3 py-2.5 text-right">Cantidad</th>
                  <th className="px-3 py-2.5 text-right">Horas</th>
                  <th className="px-3 py-2.5">Idioma</th>
                  <th className="px-3 py-2.5">Estado</th>
                  <th className="px-4 py-2.5 text-right">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fj-border">
                {partes.map((p) => (
                  <tr key={p.id} className="hover:bg-fj-surface-2">
                    <td className="px-4 py-2.5">
                      <Link href={`/partes/${p.id}`} className="font-medium text-fj-navy hover:underline">
                        {formatearFecha(p.fecha_trabajo)}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">{p.operario_nombre ?? <span className="text-fj-faint">—</span>}</td>
                    <td className="px-3 py-2.5">{p.obra ?? <span className="text-fj-faint">—</span>}</td>
                    <td className="px-3 py-2.5 text-fj-muted">{p.partida ?? "—"}</td>
                    <td className="max-w-xs truncate px-3 py-2.5" title={p.trabajo_realizado ?? ""}>
                      {p.trabajo_realizado ?? "—"}
                    </td>
                    <td className="tabular px-3 py-2.5 text-right">
                      {numero(p.cantidad) !== null ? `${numero(p.cantidad)} ${p.unidad ?? ""}`.trim() : "—"}
                    </td>
                    <td className="tabular px-3 py-2.5 text-right">{numero(p.horas) ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <span className="rounded bg-fj-surface-2 px-1.5 py-0.5 font-mono text-xs uppercase text-fj-muted" title={ETIQUETA_IDIOMA[p.idioma_detectado ?? ""] ?? p.idioma_detectado ?? ""}>
                        {p.idioma_detectado ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <InsigniaEstadoParte estado={p.estado} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/partes/${p.id}`} aria-label="Ver parte" title="Ver parte" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-fj-navy-soft text-fj-navy hover:bg-fj-navy hover:text-white">
                        <IconoOjo />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </>
  );
}
