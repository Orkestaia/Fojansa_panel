import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerAviso } from "@/lib/datos/avisos";
import { obtenerComunidad } from "@/lib/datos/comunidades";
import { obtenerContacto } from "@/lib/datos/contactos";
import { ETIQUETA_ALCANCE, etiqueta, etiquetaSiNo } from "@/lib/etiquetas";
import { formatearDuracion, formatearEuros, formatearFechaHora } from "@/lib/fechas";
import { textoParaGoManage } from "@/lib/gomanage";
import { Canal, Dato, InsigniaEstadoAviso, InsigniaEstadoContacto, InsigniaTipo, Tarjeta, Titulo } from "@/components/ui";
import { AccionesAviso } from "@/components/AccionesAviso";
import { EnlaceMapa, MapaIncrustado } from "@/components/Mapa";
import { Refresco } from "@/components/Refresco";

export const metadata = { title: "Detalle del aviso" };

/** Detalle del aviso (spec §2.2): todos los campos, grabación, transcripción, comunidad, acciones. */
export default async function PaginaAviso({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const aviso = await obtenerAviso(id);
  if (!aviso) notFound();
  const [comunidad, contacto] = await Promise.all([
    aviso.comunidad_id ? obtenerComunidad(aviso.comunidad_id) : null,
    aviso.contacto_id ? obtenerContacto(aviso.contacto_id) : null,
  ]);

  const esParticular = aviso.tipo === "averia_particular";
  const esRecibo = aviso.tipo === "recibo";

  return (
    <>
      <Refresco segundos={15} />
      <nav className="mb-3 text-sm text-fj-muted">
        <Link href="/avisos" className="hover:text-fj-navy hover:underline">
          Avisos
        </Link>{" "}
        / Detalle
      </nav>
      <Titulo
        sub={
          <span className="inline-flex flex-wrap items-center gap-2">
            {formatearFechaHora(aviso.created_at)} · <Canal canal={aviso.canal} /> · <InsigniaTipo tipo={aviso.tipo} />
            {aviso.urgente && <span className="rounded-full bg-fj-danger px-2 py-0.5 text-xs font-semibold text-white">Urgente</span>}
            <InsigniaEstadoAviso estado={aviso.estado} />
          </span>
        }
      >
        {aviso.direccion ?? "Aviso sin dirección"}
        {aviso.piso ? `, ${aviso.piso}` : ""}
      </Titulo>

      {aviso.estado === "revisar" && (
        <div className="mb-4 rounded-xl border border-fj-warn/30 bg-fj-warn-soft px-4 py-3 text-sm text-fj-warn">
          <strong>Para revisar:</strong> {aviso.motivo_revisar ?? "sin motivo indicado"}
        </div>
      )}
      {aviso.estado === "pasado_al_programa" && (
        <div className="mb-4 rounded-xl border border-fj-ok/30 bg-fj-ok-soft px-4 py-3 text-sm text-fj-ok">
          Pasado al programa por <strong>{aviso.pasado_por ?? "—"}</strong> el {formatearFechaHora(aviso.pasado_at)}.
        </div>
      )}
      {aviso.derivado_a && (
        <div className="mb-4 rounded-xl border border-fj-info/30 bg-fj-info-soft px-4 py-3 text-sm text-fj-info">
          Derivado a <strong>{aviso.derivado_a}</strong>
          {aviso.derivado_at && <> el {formatearFechaHora(aviso.derivado_at)}</>}.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Tarjeta className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-fj-text">Qué ha pasado</h2>
            <p className="text-base text-fj-text">{aviso.descripcion ?? <span className="text-fj-faint">Sin descripción</span>}</p>
            {aviso.resumen && <p className="mt-3 rounded-lg bg-fj-surface-2 px-3 py-2 text-sm text-fj-muted">{aviso.resumen}</p>}
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Dato etiqueta="Tipo de avería">{aviso.tipo_averia ?? "—"}</Dato>
              <Dato etiqueta="Alcance">{etiqueta(ETIQUETA_ALCANCE, aviso.alcance)}</Dato>
              <Dato etiqueta="Desde cuándo">{aviso.desde_cuando ?? "—"}</Dato>
              <Dato etiqueta="Llamada repetida">{etiquetaSiNo(aviso.repetida)}</Dato>
              {esParticular && (
                <>
                  <Dato etiqueta="Marca">{aviso.marca || "—"}</Dato>
                  <Dato etiqueta="Modelo">{aviso.modelo || "—"}</Dato>
                  <Dato etiqueta="Antigüedad">{aviso.antiguedad || "—"}</Dato>
                  <Dato etiqueta="Contrato de mantenimiento">{etiquetaSiNo(aviso.contrato_mantenimiento)}</Dato>
                </>
              )}
              {esRecibo && (
                <>
                  <Dato etiqueta="Lectura comprobada">{etiquetaSiNo(aviso.lectura_comprobada)}</Dato>
                  <Dato etiqueta="Email">{aviso.email || "—"}</Dato>
                </>
              )}
            </dl>
          </Tarjeta>

          <Tarjeta className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-fj-text">Quién llama</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Dato etiqueta="Nombre">{aviso.nombre ?? "—"}</Dato>
              <Dato etiqueta="Teléfono">
                {aviso.telefono ? (
                  <a href={`tel:${aviso.telefono}`} className="tabular text-fj-navy hover:underline">
                    {aviso.telefono}
                  </a>
                ) : (
                  "—"
                )}
              </Dato>
              <Dato etiqueta="Dirección">
                {aviso.direccion ? (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {aviso.direccion}
                    <EnlaceMapa direccion={aviso.direccion} soloIcono />
                  </span>
                ) : (
                  "—"
                )}
              </Dato>
              <Dato etiqueta="Piso">{aviso.piso ?? "—"}</Dato>
              <Dato etiqueta="Comunidad reconocida" ancho>
                {comunidad ? (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <span className="text-fj-ok">✓ Sí</span>
                    <Link href={`/comunidades?q=${encodeURIComponent(comunidad.direccion)}`} className="text-fj-navy hover:underline">
                      {comunidad.nombre ?? comunidad.direccion}
                    </Link>
                    {!comunidad.contrato_vigente && <span className="text-xs text-fj-warn">sin contrato vigente</span>}
                    {!comunidad.pagos_al_dia && <span className="text-xs text-fj-danger">pagos pendientes</span>}
                  </span>
                ) : aviso.comunidad_reconocida === false ? (
                  <span className="text-fj-warn">No: la dirección no está en la lista de comunidades</span>
                ) : (
                  <span className="text-fj-faint">No aplica</span>
                )}
              </Dato>
              <Dato etiqueta="Contacto" ancho>
                {contacto ? (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <Link href={`/contactos/${contacto.id}`} className="text-fj-navy hover:underline">
                      {contacto.nombre ?? contacto.telefono ?? "Ver ficha"}
                    </Link>
                    <InsigniaEstadoContacto estado={contacto.estado_efectivo} />
                  </span>
                ) : (
                  <span className="text-fj-faint">Sin contacto (no hay teléfono o aún no se ha vinculado)</span>
                )}
              </Dato>
            </dl>
            {aviso.direccion && (
              <div className="mt-4">
                <MapaIncrustado direccion={aviso.direccion} alto={220} />
              </div>
            )}
          </Tarjeta>

          <Tarjeta className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-fj-text">Grabación</h2>
            {aviso.url_grabacion ? (
              <audio controls preload="none" src={aviso.url_grabacion} className="w-full">
                Tu navegador no reproduce audio.{" "}
                <a href={aviso.url_grabacion} className="text-fj-navy underline">
                  Descargar
                </a>
              </audio>
            ) : (
              <p className="text-sm text-fj-faint">{aviso.canal === "voz" ? "Sin grabación disponible." : "Los chats no tienen grabación."}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-fj-muted">
              <span>
                Duración: <span className="tabular text-fj-text">{formatearDuracion(aviso.duracion_s)}</span>
              </span>
              <span>
                Coste: <span className="tabular text-fj-text">{formatearEuros(aviso.coste_eur)}</span>
              </span>
              {aviso.call_id && (
                <span className="truncate">
                  Call ID: <span className="font-mono text-xs text-fj-text">{aviso.call_id}</span>
                </span>
              )}
            </div>
            {aviso.transcripcion && (
              <details className="mt-4 rounded-lg border border-fj-border">
                <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-fj-navy">Transcripción</summary>
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap px-3 pb-3 font-sans text-sm leading-relaxed text-fj-text">{aviso.transcripcion}</pre>
              </details>
            )}
          </Tarjeta>
        </div>

        <div className="space-y-4">
          <AccionesAviso
            id={aviso.id}
            estado={aviso.estado}
            motivoRevisar={aviso.motivo_revisar}
            contactoId={aviso.contacto_id}
            derivadoA={aviso.derivado_a}
            textoGoManage={textoParaGoManage(aviso)}
          />
        </div>
      </div>
    </>
  );
}
