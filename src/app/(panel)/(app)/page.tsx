import Link from "next/link";
import { obtenerMetricas } from "@/lib/datos/metricas";
import { esPeriodo, formatearDuracion, formatearEuros, formatearPorcentaje, PERIODOS, type Periodo } from "@/lib/fechas";
import { ETIQUETA_TIPO } from "@/lib/etiquetas";
import { Tarjeta, Titulo } from "@/components/ui";
import { GraficoPorHora, GraficoPorTipo } from "@/components/Graficos";
import { Refresco } from "@/components/Refresco";

export const metadata = { title: "Inicio" };

/** Inicio · Hoy (spec §2.1). Periodo seleccionable por query (?periodo=hoy|7d|30d|temporada). */
export default async function PaginaInicio({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const sp = await searchParams;
  const periodo: Periodo = esPeriodo(sp.periodo) ? sp.periodo : "hoy";
  const { metricas: m, partesHoy } = await obtenerMetricas(periodo);
  const etiquetaPeriodo = PERIODOS.find((p) => p.clave === periodo)?.etiqueta ?? "";

  return (
    <>
      <Refresco segundos={30} />
      <Titulo
        sub="Llamadas y chats atendidos por el asistente, su coste y lo que queda por revisar."
        acciones={
          <div role="tablist" aria-label="Periodo" className="flex rounded-lg border border-fj-border bg-fj-surface p-0.5">
            {PERIODOS.map((p) => (
              <Link
                key={p.clave}
                role="tab"
                aria-selected={p.clave === periodo}
                href={p.clave === "hoy" ? "/" : `/?periodo=${p.clave}`}
                className={`rounded-md px-3 py-1 text-sm font-medium ${
                  p.clave === periodo ? "bg-fj-navy text-white" : "text-fj-muted hover:text-fj-navy"
                }`}
              >
                {p.etiqueta}
              </Link>
            ))}
          </div>
        }
      >
        Inicio · {etiquetaPeriodo}
      </Titulo>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Resumen">
        <Cifra titulo="Atendidos" valor={m.total} pie={`${m.porCanal.voz} voz · ${m.porCanal.chat} chat`} />
        <Cifra
          titulo="Satisfactorios"
          valor={formatearPorcentaje(m.porcentajeSatisfactorios)}
          pie={`${m.satisfactorios} de ${m.avisosReales} avisos con datos completos`}
          destacado
        />
        <Cifra
          titulo="Para revisar"
          valor={m.paraRevisar}
          pie={m.paraRevisar > 0 ? "Ver la lista" : "Nada pendiente"}
          href={m.paraRevisar > 0 ? "/avisos?estado=revisar" : undefined}
          tono={m.paraRevisar > 0 ? "warn" : undefined}
        />
        <Cifra
          titulo="Urgentes"
          valor={m.urgentes}
          pie={m.urgentes > 0 ? "Ver urgencias" : "Ninguna"}
          href={m.urgentes > 0 ? "/avisos?urgente=1" : undefined}
          tono={m.urgentes > 0 ? "danger" : undefined}
        />
        <Cifra
          titulo="Coste total"
          valor={formatearEuros(m.costeTotal)}
          pie={`${formatearEuros(m.costeMedio)} por llamada · ${m.llamadasConCoste} con coste`}
        />
        <Cifra titulo="Duración media" valor={formatearDuracion(m.duracionMedia)} pie="de las llamadas de voz" />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2" aria-label="Gráficos">
        <Tarjeta className="p-4">
          <h2 className="text-sm font-semibold text-fj-text">Por tipo de aviso</h2>
          <p className="mb-3 text-xs text-fj-muted">Qué está entrando por el asistente.</p>
          <GraficoPorTipo datos={m.porTipo.map((x) => ({ nombre: x.tipo === "sin_tipo" ? "Sin tipo" : ETIQUETA_TIPO[x.tipo], n: x.n }))} />
        </Tarjeta>
        <Tarjeta className="p-4">
          <h2 className="text-sm font-semibold text-fj-text">Por hora del día</h2>
          <p className="mb-3 text-xs text-fj-muted">Hora de Vitoria. Lo que entra fuera del horario de oficina.</p>
          <GraficoPorHora datos={m.porHora} />
        </Tarjeta>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2" aria-label="Partes">
        <Tarjeta className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-sm font-semibold text-fj-text">Partes de hoy</h2>
            <p className="text-xs text-fj-muted">Notas de voz de los operarios convertidas en partes.</p>
          </div>
          <div className="text-right">
            <p className="tabular text-2xl font-semibold text-fj-navy">{partesHoy.total}</p>
            <Link href="/partes?estado=pendiente_revision" className="text-xs text-fj-muted underline-offset-2 hover:underline">
              {partesHoy.pendientes} pendientes de revisión
            </Link>
          </div>
        </Tarjeta>
        <Tarjeta className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-sm font-semibold text-fj-text">Bandeja de avisos</h2>
            <p className="text-xs text-fj-muted">Los avisos nuevos aparecen solos al colgar.</p>
          </div>
          <Link href="/avisos" className="rounded-lg bg-fj-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-fj-navy-hi">
            Abrir bandeja
          </Link>
        </Tarjeta>
      </section>
    </>
  );
}

function Cifra({
  titulo,
  valor,
  pie,
  href,
  tono,
  destacado = false,
}: {
  titulo: string;
  valor: string | number;
  pie?: string;
  href?: string;
  tono?: "warn" | "danger";
  destacado?: boolean;
}) {
  const colorValor = tono === "danger" ? "text-fj-danger" : tono === "warn" ? "text-fj-warn" : "text-fj-navy";
  const contenido = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-fj-faint">{titulo}</p>
      <p className={`tabular mt-1 text-3xl font-semibold leading-none ${colorValor}`}>{valor}</p>
      {pie && <p className="mt-2 text-xs text-fj-muted">{pie}</p>}
    </>
  );
  const clase = `block h-full rounded-xl border p-4 ${
    destacado ? "border-fj-navy/20 bg-fj-navy-soft" : "border-fj-border bg-fj-surface"
  } ${href ? "transition-colors hover:border-fj-border-hi" : ""}`;
  return href ? (
    <Link href={href} className={clase}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}
