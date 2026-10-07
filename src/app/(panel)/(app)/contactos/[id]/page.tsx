import Link from "next/link";
import { notFound } from "next/navigation";
import { listarComunidades } from "@/lib/datos/comunidades";
import { avisosDelContacto, obtenerContacto } from "@/lib/datos/contactos";
import { listarPartes } from "@/lib/datos/partes";
import { formatearCorta, formatearEuros } from "@/lib/fechas";
import { Canal, InsigniaEstadoAviso, InsigniaEstadoContacto, InsigniaEstadoParte, InsigniaTipo, Tarjeta, Titulo, Vacio } from "@/components/ui";
import { FormularioContacto } from "@/components/FormularioContacto";

export const metadata = { title: "Ficha del contacto" };

/** Ficha del contacto (spec §2.3): datos editables, historial de avisos (voz y chat), partes si es obra, notas. */
export default async function PaginaContacto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contacto = await obtenerContacto(id);
  if (!contacto) notFound();
  const [avisos, comunidades, partes] = await Promise.all([
    avisosDelContacto(id),
    listarComunidades(),
    contacto.tipo_cliente === "empresa" && contacto.nombre ? listarPartes({ obra: contacto.nombre, limite: 50 }) : Promise.resolve([]),
  ]);

  return (
    <>
      <nav className="mb-3 text-sm text-fj-muted">
        <Link href="/contactos" className="hover:text-fj-navy hover:underline">
          Contactos
        </Link>{" "}
        / Ficha
      </nav>
      <Titulo
        sub={
          <span className="inline-flex flex-wrap items-center gap-2">
            <InsigniaEstadoContacto estado={contacto.estado_efectivo} />
            {contacto.comunidad && (
              <span>
                Comunidad: {contacto.comunidad.nombre ?? contacto.comunidad.direccion}
                {!contacto.comunidad.pagos_al_dia && <span className="text-fj-danger"> · pagos pendientes</span>}
                {!contacto.comunidad.contrato_vigente && <span className="text-fj-warn"> · sin contrato</span>}
              </span>
            )}
          </span>
        }
      >
        {contacto.nombre ?? contacto.telefono ?? "Contacto"}
      </Titulo>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <FormularioContacto
            contacto={contacto}
            comunidades={comunidades.map((c) => ({ id: c.id, texto: c.nombre ?? c.direccion }))}
            estadoDerivado={contacto.comunidad ? contacto.estado_efectivo : null}
          />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <Tarjeta className="overflow-hidden">
            <h2 className="px-5 pt-4 text-sm font-semibold text-fj-text">Historial de avisos</h2>
            <p className="px-5 pb-3 text-xs text-fj-muted">Voz y chat juntos, del más reciente al más antiguo.</p>
            {avisos.length === 0 ? (
              <div className="px-5 pb-5">
                <Vacio>Sin avisos vinculados.</Vacio>
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-fj-border border-t border-fj-border">
                  {avisos.map((a) => (
                    <tr key={a.id} className="hover:bg-fj-surface-2">
                      <td className="px-5 py-2.5">
                        <Link href={`/avisos/${a.id}`} className="font-medium text-fj-navy hover:underline">
                          {formatearCorta(a.created_at)}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <Canal canal={a.canal} />
                      </td>
                      <td className="px-3 py-2.5">
                        <InsigniaTipo tipo={a.tipo} />
                      </td>
                      <td className="px-3 py-2.5 text-fj-text">{a.descripcion ?? a.resumen ?? "—"}</td>
                      <td className="px-3 py-2.5">
                        <InsigniaEstadoAviso estado={a.estado} />
                      </td>
                      <td className="tabular px-5 py-2.5 text-right text-fj-muted">{formatearEuros(a.coste_eur)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Tarjeta>

          {partes.length > 0 && (
            <Tarjeta className="overflow-hidden">
              <h2 className="px-5 pt-4 text-sm font-semibold text-fj-text">Partes de la obra</h2>
              <p className="px-5 pb-3 text-xs text-fj-muted">Partes cuyo nombre de obra coincide con este contacto.</p>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-fj-border border-t border-fj-border">
                  {partes.map((p) => (
                    <tr key={p.id} className="hover:bg-fj-surface-2">
                      <td className="px-5 py-2.5">
                        <Link href={`/partes/${p.id}`} className="font-medium text-fj-navy hover:underline">
                          {p.fecha_trabajo}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">{p.operario_nombre ?? "—"}</td>
                      <td className="px-3 py-2.5">{p.trabajo_realizado ?? "—"}</td>
                      <td className="px-3 py-2.5">
                        <InsigniaEstadoParte estado={p.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tarjeta>
          )}
        </div>
      </div>
    </>
  );
}
