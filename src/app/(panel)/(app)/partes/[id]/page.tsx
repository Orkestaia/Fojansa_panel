import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerParte } from "@/lib/datos/partes";
import { ETIQUETA_CANAL, ETIQUETA_IDIOMA } from "@/lib/etiquetas";
import { formatearDuracion, formatearFecha, formatearFechaHora } from "@/lib/fechas";
import { InsigniaEstadoParte, Tarjeta, Titulo } from "@/components/ui";
import { AccionesParte } from "@/components/AccionesParte";

export const metadata = { title: "Detalle del parte" };

/** Detalle del parte (spec §2.5): transcripción original y en español lado a lado, datos y acciones. */
export default async function PaginaParte({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parte = await obtenerParte(id);
  if (!parte) notFound();
  const idioma = parte.idioma_detectado ? (ETIQUETA_IDIOMA[parte.idioma_detectado] ?? parte.idioma_detectado) : "Idioma desconocido";

  return (
    <>
      <nav className="mb-3 text-sm text-fj-muted">
        <Link href="/partes" className="hover:text-fj-navy hover:underline">
          Partes
        </Link>{" "}
        / Detalle
      </nav>
      <Titulo
        sub={
          <span className="inline-flex flex-wrap items-center gap-2">
            {formatearFecha(parte.fecha_trabajo)} · {parte.operario_nombre ?? "Operario sin nombre"} · {ETIQUETA_CANAL[parte.canal] ?? parte.canal} · {idioma}
            {parte.audio_duracion_s !== null && <span>· audio {formatearDuracion(parte.audio_duracion_s)}</span>}
            <InsigniaEstadoParte estado={parte.estado} />
          </span>
        }
      >
        {parte.obra ?? "Parte sin obra"}
        {parte.partida ? ` · ${parte.partida}` : ""}
      </Titulo>

      {parte.estado === "pendiente_revision" && parte.motivo_revisar && (
        <div className="mb-4 rounded-xl border border-fj-warn/30 bg-fj-warn-soft px-4 py-3 text-sm text-fj-warn">
          <strong>Falta algo:</strong> {parte.motivo_revisar}
        </div>
      )}
      {parte.revisado_at && (
        <div className="mb-4 rounded-xl border border-fj-border bg-fj-surface-2 px-4 py-3 text-sm text-fj-muted">
          Revisado por <strong className="text-fj-text">{parte.revisado_por ?? "—"}</strong> el {formatearFechaHora(parte.revisado_at)}.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <Tarjeta className="p-5">
              <h2 className="mb-2 text-sm font-semibold text-fj-text">Lo que dijo ({idioma})</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-fj-muted">{parte.transcripcion_original ?? "—"}</p>
            </Tarjeta>
            <Tarjeta className="p-5">
              <h2 className="mb-2 text-sm font-semibold text-fj-text">En español</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-fj-text">{parte.transcripcion_es ?? "—"}</p>
            </Tarjeta>
          </div>
          <Tarjeta className="p-5">
            <h2 className="mb-1 text-sm font-semibold text-fj-text">Audio</h2>
            <p className="text-sm text-fj-faint">El audio original no se guarda en la demo; solo la transcripción.</p>
          </Tarjeta>
        </div>
        <div>
          <AccionesParte parte={parte} />
        </div>
      </div>
    </>
  );
}
