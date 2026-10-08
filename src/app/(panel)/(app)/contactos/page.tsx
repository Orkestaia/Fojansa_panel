import Link from "next/link";
import { listarContactos } from "@/lib/datos/contactos";
import { ETIQUETA_CANAL, ETIQUETA_ESTADO_CONTACTO, ETIQUETA_TIPO_CLIENTE, etiqueta } from "@/lib/etiquetas";
import { formatearCorta } from "@/lib/fechas";
import { ESTADOS_CONTACTO, type CanalAviso, type EstadoContacto } from "@/lib/tipos";
import { InsigniaEstadoContacto, Tarjeta, Titulo, Vacio } from "@/components/ui";
import { BuscadorSimple } from "@/components/BuscadorSimple";
import { IconoOjo } from "@/components/Mapa";

export const metadata = { title: "Contactos" };

/** Contactos · CRM ligero de los dos canales (spec §2.3). */
export default async function PaginaContactos({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string }> }) {
  const sp = await searchParams;
  const estado = (ESTADOS_CONTACTO as readonly string[]).includes(sp.estado ?? "") ? (sp.estado as EstadoContacto) : undefined;
  const contactos = await listarContactos(sp.q, estado);

  return (
    <>
      <Titulo
        sub="Quien ha llamado o escrito, con su comunidad, contrato y estado. Se crean solos con cada aviso que trae teléfono."
        acciones={
          <Link href="/contactos/nuevo" className="rounded-lg bg-fj-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-fj-navy-hi">
            Nuevo contacto
          </Link>
        }
      >
        Contactos
      </Titulo>
      <BuscadorSimple
        placeholder="Buscar nombre, teléfono, dirección…"
        filtros={[{ clave: "estado", etiqueta: "Estado", opciones: ESTADOS_CONTACTO.map((e) => ({ valor: e, texto: ETIQUETA_ESTADO_CONTACTO[e] })) }]}
      />
      <Tarjeta className="mt-4 overflow-hidden" data-tour="contactos-tabla">
        {contactos.length === 0 ? (
          <Vacio>No hay contactos {sp.q || estado ? "con esta búsqueda" : "todavía"}.</Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-fj-surface-2 text-left text-xs font-medium uppercase tracking-wide text-fj-faint">
                <tr>
                  <th className="px-4 py-2.5">Nombre</th>
                  <th className="px-3 py-2.5">Teléfono</th>
                  <th className="px-3 py-2.5">Dirección</th>
                  <th className="px-3 py-2.5">Tipo</th>
                  <th className="px-3 py-2.5">Comunidad</th>
                  <th className="px-3 py-2.5">Contrato</th>
                  <th className="px-3 py-2.5">Estado</th>
                  <th className="px-3 py-2.5 text-right">Avisos</th>
                  <th className="px-3 py-2.5">Último aviso</th>
                  <th className="px-3 py-2.5">Canal</th>
                  <th className="px-4 py-2.5 text-right">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fj-border">
                {contactos.map((c) => (
                  <tr key={c.id} className="hover:bg-fj-surface-2">
                    <td className="px-4 py-2.5">
                      <Link href={`/contactos/${c.id}`} className="font-medium text-fj-navy hover:underline">
                        {c.nombre ?? <span className="italic text-fj-muted">Sin nombre</span>}
                      </Link>
                    </td>
                    <td className="tabular px-3 py-2.5">{c.telefono ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      {c.direccion ?? "—"}
                      {c.piso && <span className="text-fj-muted">, {c.piso}</span>}
                    </td>
                    <td className="px-3 py-2.5">{etiqueta(ETIQUETA_TIPO_CLIENTE, c.tipo_cliente)}</td>
                    <td className="px-3 py-2.5">{c.comunidad ? (c.comunidad.nombre ?? c.comunidad.direccion) : <span className="text-fj-faint">—</span>}</td>
                    <td className="px-3 py-2.5">
                      {c.comunidad ? (c.comunidad.contrato_vigente ? "Sí" : "No") : c.contrato_mantenimiento === null ? "—" : c.contrato_mantenimiento ? "Sí" : "No"}
                    </td>
                    <td className="px-3 py-2.5">
                      <InsigniaEstadoContacto estado={c.estado_efectivo} />
                    </td>
                    <td className="tabular px-3 py-2.5 text-right">{c.n_avisos}</td>
                    <td className="px-3 py-2.5 text-fj-muted">{c.ultimo_aviso ? formatearCorta(c.ultimo_aviso) : "—"}</td>
                    <td className="px-3 py-2.5 text-fj-muted">{c.canal_preferido ? (ETIQUETA_CANAL[c.canal_preferido as CanalAviso] ?? c.canal_preferido) : "—"}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/contactos/${c.id}`} aria-label="Ver ficha" title="Ver ficha" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-fj-navy-soft text-fj-navy hover:bg-fj-navy hover:text-white">
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
