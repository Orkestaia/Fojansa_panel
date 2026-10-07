import Link from "next/link";
import { listarAvisos, mapaComunidades, vincularAvisosSinContacto, type FiltrosAvisos } from "@/lib/datos/avisos";
import { formatearCorta, formatearEuros, haceCuanto } from "@/lib/fechas";
import { CANALES_AVISO, ESTADOS_AVISO, TIPOS_AVISO, type CanalAviso, type EstadoAviso, type TipoAviso } from "@/lib/tipos";
import { Canal, InsigniaEstadoAviso, InsigniaTipo, Tarjeta, Titulo, Vacio } from "@/components/ui";
import { FiltrosBandeja } from "@/components/FiltrosBandeja";
import { Refresco } from "@/components/Refresco";

export const metadata = { title: "Avisos" };

type SP = Record<string, string | undefined>;

/**
 * Bandeja de avisos (spec §2.2). Filtros por query string (estado, canal, tipo, urgente, fecha,
 * texto libre con tolerancia a euskera). Se refresca cada 10 s para que la fila aparezca sola al colgar.
 * Al abrir, vincula los avisos sin contacto (spec §2.3, "más simple para la demo").
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
      <Tarjeta className="mt-4 overflow-hidden">
        {avisos.length === 0 ? (
          <Vacio>No hay avisos {hayFiltros ? "con estos filtros" : "todavía"}. Cuando entre una llamada o un chat aparecerá aquí.</Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
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
                  <th className="px-4 py-2.5 text-right">Coste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fj-border">
                {avisos.map((a) => {
                  const com = a.comunidad_id ? comunidades.get(a.comunidad_id) : undefined;
                  return (
                    <tr key={a.id} className={`group hover:bg-fj-surface-2 ${a.urgente ? "bg-fj-danger-soft/40" : ""}`}>
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
                          {a.urgente && (
                            <span className="rounded-full bg-fj-danger px-2 py-0.5 text-xs font-semibold text-white">Urgente</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <Link href={`/avisos/${a.id}`} className="block text-fj-text">
                          {a.direccion ?? <span className="text-fj-faint">Sin dirección</span>}
                          {a.piso && <span className="text-fj-muted">, {a.piso}</span>}
                        </Link>
                        {com && (
                          <span className="text-xs text-fj-ok" title="Comunidad reconocida">
                            ✓ {com.nombre ?? com.direccion}
                          </span>
                        )}
                        {a.comunidad_reconocida === false && <span className="text-xs text-fj-warn">Comunidad no reconocida</span>}
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
                      <td className="tabular px-4 py-2.5 text-right align-top text-fj-text">{formatearEuros(a.coste_eur)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
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
