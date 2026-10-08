import Link from "next/link";
import { listarAvisos, mapaComunidades, vincularAvisosSinContacto, type FiltrosAvisos } from "@/lib/datos/avisos";
import { formatearCorta, formatearEuros, haceCuanto } from "@/lib/fechas";
import { CANALES_AVISO, ESTADOS_AVISO, TIPOS_AVISO, type Aviso, type CanalAviso, type EstadoAviso, type TipoAviso } from "@/lib/tipos";
import { Canal, IconoCanal, InsigniaEstadoAviso, InsigniaTipo, Tarjeta, Titulo, Vacio } from "@/components/ui";
import { EnlaceMapa, IconoOjo } from "@/components/Mapa";
import { FiltrosBandeja } from "@/components/FiltrosBandeja";
import { Refresco } from "@/components/Refresco";

export const metadata = { title: "Avisos" };

type SP = Record<string, string | undefined>;

/** Color de la franja izquierda según el tipo (urgencias, averías, recibos, resto). */
function franjaTipo(a: Pick<Aviso, "tipo" | "urgente">): string {
  if (a.urgente || a.tipo === "urgencia") return "border-l-fj-danger";
  if (a.tipo === "averia_comunidad" || a.tipo === "averia_particular") return "border-l-fj-navy";
  if (a.tipo === "recibo") return "border-l-fj-cyan";
  return "border-l-fj-border-hi";
}

const LEYENDA = [
  { clase: "bg-fj-danger", texto: "Urgente" },
  { clase: "bg-fj-navy", texto: "Avería" },
  { clase: "bg-fj-cyan", texto: "Recibo" },
  { clase: "bg-fj-border-hi", texto: "Otros (presupuesto, persona, silencio)" },
];

/**
 * Bandeja de avisos (spec §2.2). Filtros por query string (estado, canal, tipo, urgente, fecha,
 * texto libre con tolerancia a euskera). Se refresca cada 10 s para que la fila aparezca sola al colgar.
 * Al abrir, vincula los avisos sin contacto (spec §2.3). En móvil se ve como tarjetas; en tablet y
 * escritorio como tabla.
 */
export default async function PaginaAvisos({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const filtros = leerFiltros(sp);

  try {
    await vincularAvisosSinContacto();
  } catch (e) {
    console.error("[bandeja] vincular:", e instanceof Error ? e.message : e);
  }

  const [avisos, comunidades] = await Promise.all([listarAvisos(filtros), mapaComunidades()]);
  const hayFiltros = Object.keys(sp).some((k) => sp[k]);

  return (
    <>
      <Refresco segundos={10} />
      <Titulo sub={`${avisos.length} ${avisos.length === 1 ? "aviso" : "avisos"}${hayFiltros ? " con estos filtros" : ""} · se actualiza solo cada 10 s`}>
        Avisos
      </Titulo>
      <FiltrosBandeja />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fj-muted" aria-label="Leyenda de colores">
        {LEYENDA.map((l) => (
          <span key={l.texto} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3 w-1.5 rounded-sm ${l.clase}`} aria-hidden />
            {l.texto}
          </span>
        ))}
      </div>

      {avisos.length === 0 ? (
        <div className="mt-3">
          <Vacio>No hay avisos {hayFiltros ? "con estos filtros" : "todavía"}. Cuando entre una llamada o un chat aparecerá aquí.</Vacio>
        </div>
      ) : (
        <>
          {/* Móvil: tarjetas */}
          <ul className="mt-3 flex flex-col gap-2 md:hidden">
            {avisos.map((a) => {
              const com = a.comunidad_id ? comunidades.get(a.comunidad_id) : undefined;
              return (
                <li key={a.id} className={`rounded-xl border border-l-4 border-fj-border bg-fj-surface p-3 ${franjaTipo(a)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/avisos/${a.id}`} className="min-w-0 flex-1">
                      <p className="truncate font-medium text-fj-text">
                        {a.direccion ?? "Sin dirección"}
                        {a.piso && <span className="text-fj-muted">, {a.piso}</span>}
                      </p>
                      <p className="text-xs text-fj-muted">
                        {formatearCorta(a.created_at)} · {haceCuanto(a.created_at)}
                      </p>
                    </Link>
                    <Link href={`/avisos/${a.id}`} aria-label="Ver aviso" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fj-navy-soft text-fj-navy">
                      <IconoOjo />
                    </Link>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-xs text-fj-muted">
                      <IconoCanal canal={a.canal} className="h-3.5 w-3.5 text-fj-navy" />
                    </span>
                    <InsigniaTipo tipo={a.tipo} />
                    {a.urgente && <span className="rounded-full bg-fj-danger px-2 py-0.5 text-xs font-semibold text-white">Urgente</span>}
                    <InsigniaEstadoAviso estado={a.estado} />
                    {a.derivado_a && <span className="text-xs text-fj-warn">→ {a.derivado_a}</span>}
                  </div>
                  <p className="mt-1.5 text-sm text-fj-text">
                    {a.nombre ?? <span className="text-fj-faint">Sin nombre</span>}
                    {a.telefono && <span className="tabular text-fj-muted"> · {a.telefono}</span>}
                    {a.coste_eur !== null && <span className="tabular text-fj-muted"> · {formatearEuros(a.coste_eur)}</span>}
                  </p>
                  {!(a.datos_completos && a.estado !== "revisar") && (
                    <p className="mt-1 text-xs text-fj-warn">Revisar{a.motivo_revisar ? `: ${a.motivo_revisar}` : ""}</p>
                  )}
                  {com && <p className="mt-1 text-xs text-fj-ok">✓ {com.nombre ?? com.direccion}</p>}
                </li>
              );
            })}
          </ul>

          {/* Tablet y escritorio: tabla */}
          <Tarjeta className="mt-3 hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="bg-fj-surface-2 text-left text-xs font-medium uppercase tracking-wide text-fj-faint">
                  <tr>
                    <th className="px-4 py-2.5">Fecha / hora</th>
                    <th className="px-3 py-2.5">Canal</th>
                    <th className="px-3 py-2.5">Tipo</th>
                    <th className="px-3 py-2.5">Dirección</th>
                    <th className="px-3 py-2.5">Nombre</th>
                    <th className="px-3 py-2.5">Teléfono</th>
                    <th className="px-3 py-2.5">Datos completos</th>
                    <th className="px-3 py-2.5">Estado</th>
                    <th className="px-3 py-2.5">Derivado a</th>
                    <th className="px-3 py-2.5 text-right">Coste</th>
                    <th className="px-3 py-2.5 text-right">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fj-border">
                  {avisos.map((a) => {
                    const com = a.comunidad_id ? comunidades.get(a.comunidad_id) : undefined;
                    return (
                      <tr key={a.id} className={`border-l-4 hover:bg-fj-surface-2 ${franjaTipo(a)} ${a.urgente ? "bg-fj-danger-soft/40" : ""}`}>
                        <td className="whitespace-nowrap px-4 py-2.5 align-top">
                          <Link href={`/avisos/${a.id}`} className="block font-medium text-fj-navy hover:underline">
                            {formatearCorta(a.created_at)}
                          </Link>
                          <span className="text-xs text-fj-faint">{haceCuanto(a.created_at)}</span>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <Canal canal={a.canal} />
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <div className="flex flex-wrap items-center gap-1">
                            <InsigniaTipo tipo={a.tipo} />
                            {a.urgente && <span className="rounded-full bg-fj-danger px-2 py-0.5 text-xs font-semibold text-white">Urgente</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <div className="flex items-start gap-1">
                            <Link href={`/avisos/${a.id}`} className="block text-fj-text">
                              {a.direccion ?? <span className="text-fj-faint">Sin dirección</span>}
                              {a.piso && <span className="text-fj-muted">, {a.piso}</span>}
                            </Link>
                            {a.direccion && <EnlaceMapa direccion={a.direccion} soloIcono />}
                          </div>
                          {com && (
                            <span className="block text-xs text-fj-ok" title="Comunidad reconocida">
                              ✓ {com.nombre ?? com.direccion}
                            </span>
                          )}
                          {a.comunidad_reconocida === false && <span className="block text-xs text-fj-warn">Comunidad no reconocida</span>}
                        </td>
                        <td className="px-3 py-2.5 align-top text-fj-text">{a.nombre ?? <span className="text-fj-faint">—</span>}</td>
                        <td className="tabular px-3 py-2.5 align-top text-fj-text">{a.telefono ?? <span className="text-fj-faint">—</span>}</td>
                        <td className="px-3 py-2.5 align-top">
                          {a.datos_completos && a.estado !== "revisar" ? (
                            <span className="text-fj-ok" title="Datos completos">
                              ✔ Sí
                            </span>
                          ) : (
                            <span className="text-fj-warn">Revisar{a.motivo_revisar ? `: ${a.motivo_revisar}` : ""}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <InsigniaEstadoAviso estado={a.estado} />
                        </td>
                        <td className="px-3 py-2.5 align-top text-fj-text">{a.derivado_a ?? <span className="text-fj-faint">—</span>}</td>
                        <td className="tabular px-3 py-2.5 text-right align-top text-fj-text">{formatearEuros(a.coste_eur)}</td>
                        <td className="px-3 py-2.5 text-right align-top">
                          <Link href={`/avisos/${a.id}`} aria-label="Ver aviso" title="Ver aviso" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-fj-navy-soft text-fj-navy hover:bg-fj-navy hover:text-white">
                            <IconoOjo />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Tarjeta>
        </>
      )}
    </>
  );
}

function leerFiltros(sp: SP): FiltrosAvisos {
  const f: FiltrosAvisos = {};
  if (sp.estado === "abiertos" || (ESTADOS_AVISO as readonly string[]).includes(sp.estado ?? "")) {
    f.estado = sp.estado as EstadoAviso | "abiertos";
  }
  if (sp.canal === "chat" || (CANALES_AVISO as readonly string[]).includes(sp.canal ?? "")) f.canal = sp.canal as CanalAviso | "chat";
  if ((TIPOS_AVISO as readonly string[]).includes(sp.tipo ?? "")) f.tipo = sp.tipo as TipoAviso;
  if (sp.urgente === "1") f.urgente = true;
  if (sp.q) f.q = sp.q;
  if (sp.desde && /^\d{4}-\d{2}-\d{2}$/.test(sp.desde)) f.desde = new Date(`${sp.desde}T00:00:00+02:00`);
  if (sp.hasta && /^\d{4}-\d{2}-\d{2}$/.test(sp.hasta)) f.hasta = new Date(new Date(`${sp.hasta}T00:00:00+02:00`).getTime() + 86_400_000);
  return f;
}
