import Link from "next/link";
import { obtenerGastos } from "@/lib/datos/costes";
import { ETIQUETA_TIPO } from "@/lib/etiquetas";
import { esPeriodo, formatearCorta, formatearDuracion, formatearEuros, PERIODOS, type Periodo } from "@/lib/fechas";
import { numero, type TipoAviso } from "@/lib/tipos";
import { Tarjeta, Titulo, Vacio } from "@/components/ui";
import { GraficoPorDia, GraficoPorProducto } from "@/components/GraficosGastos";
import { Refresco } from "@/components/Refresco";

export const metadata = { title: "Gastos del agente" };

const fmtTokens = new Intl.NumberFormat("es-ES");
const fmt4 = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 3, maximumFractionDigits: 4 }).format(n);

/**
 * Gastos del agente: lo que cuesta cada llamada (desglose de Retell por producto) y cada respuesta
 * de IA (tokens y coste), con totales y evolución por día. Periodo por defecto: 30 días.
 */
export default async function PaginaGastos({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const sp = await searchParams;
  const periodo: Periodo = esPeriodo(sp.periodo) ? sp.periodo : "30d";
  const { resumen: r, llamadas, ia } = await obtenerGastos(periodo);
  const etiquetaPeriodo = PERIODOS.find((p) => p.clave === periodo)?.etiqueta ?? "";

  return (
    <>
      <Refresco segundos={30} />
      <Titulo
        sub="Cuánto cuesta el asistente: cada llamada de voz con el desglose de Retell y cada respuesta de IA con sus tokens."
        acciones={
          <div role="tablist" aria-label="Periodo" className="flex rounded-lg border border-fj-border bg-fj-surface p-0.5">
            {PERIODOS.map((p) => (
              <Link
                key={p.clave}
                role="tab"
                aria-selected={p.clave === periodo}
                href={`/gastos?periodo=${p.clave}`}
                className={`rounded-md px-3 py-1 text-sm font-medium ${p.clave === periodo ? "bg-fj-navy text-white" : "text-fj-muted hover:text-fj-navy"}`}
              >
                {p.etiqueta}
              </Link>
            ))}
          </div>
        }
      >
        Gastos · {etiquetaPeriodo}
      </Titulo>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Totales">
        <Cifra titulo="Total del periodo" valor={formatearEuros(r.total)} pie={`${formatearEuros(r.llamadas.coste)} voz · ${formatearEuros(r.ia.coste)} IA`} destacado />
        <Cifra titulo="Llamadas de voz" valor={r.llamadas.n} pie={`${r.llamadas.minutos} min en total`} />
        <Cifra titulo="Coste por llamada" valor={formatearEuros(r.llamadas.costeMedio)} pie={`${fmt4(r.llamadas.costePorMinuto)} por minuto`} />
        <Cifra titulo="Llamada más cara" valor={formatearEuros(r.llamadas.masCara?.coste ?? null)} pie={r.llamadas.masCara ? formatearDuracion(r.llamadas.masCara.duracion_s) : "—"} href={r.llamadas.masCara ? `/avisos/${r.llamadas.masCara.id}` : undefined} />
        <Cifra titulo="Respuestas de IA" valor={r.ia.n} pie={`${fmtTokens.format(r.ia.tokensEntrada + r.ia.tokensSalida)} tokens`} />
        <Cifra titulo="Coste por respuesta" valor={fmt4(r.ia.costeMedio)} pie={r.ia.n ? `${r.ia.porModelo.length} ${r.ia.porModelo.length === 1 ? "modelo" : "modelos"}` : "sin datos todavía"} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2" aria-label="Gráficos">
        <Tarjeta className="p-4">
          <h2 className="text-sm font-semibold text-fj-text">En qué se va el coste de las llamadas</h2>
          <p className="mb-3 text-xs text-fj-muted">
            Desglose de Retell por producto ({r.llamadas.conDesglose} de {r.llamadas.n} llamadas con desglose).
          </p>
          <GraficoPorProducto datos={r.llamadas.porProducto.map((p) => ({ nombre: p.etiqueta, coste: p.coste, porcentaje: p.porcentaje }))} />
        </Tarjeta>
        <Tarjeta className="p-4">
          <h2 className="text-sm font-semibold text-fj-text">Gasto por día</h2>
          <p className="mb-3 text-xs text-fj-muted">Voz e IA, en euros.</p>
          <GraficoPorDia datos={r.porDia} />
        </Tarjeta>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3" aria-label="Detalle">
        <Tarjeta className="overflow-hidden lg:col-span-2">
          <div className="px-5 pt-4">
            <h2 className="text-sm font-semibold text-fj-text">Llamadas</h2>
            <p className="pb-3 text-xs text-fj-muted">Importes de Retell (facturados en dólares, mostrados 1:1 en euros). Pulsa una fila para ver el aviso.</p>
          </div>
          {llamadas.length === 0 ? (
            <div className="px-5 pb-5">
              <Vacio>Sin llamadas de voz en este periodo.</Vacio>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-fj-surface-2 text-left text-xs font-medium uppercase tracking-wide text-fj-faint">
                  <tr>
                    <th className="px-5 py-2.5">Fecha</th>
                    <th className="px-3 py-2.5">Tipo</th>
                    <th className="px-3 py-2.5 text-right">Duración</th>
                    <th className="px-3 py-2.5 text-right">Coste</th>
                    <th className="px-3 py-2.5 text-right">€/min</th>
                    <th className="px-5 py-2.5">Desglose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fj-border">
                  {llamadas.map((l) => (
                    <tr key={l.id} className="hover:bg-fj-surface-2">
                      <td className="whitespace-nowrap px-5 py-2.5">
                        <Link href={`/avisos/${l.id}`} className="font-medium text-fj-navy hover:underline">
                          {formatearCorta(l.created_at)}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-fj-muted">{l.tipo ? (ETIQUETA_TIPO[l.tipo as TipoAviso] ?? l.tipo) : "—"}</td>
                      <td className="tabular px-3 py-2.5 text-right">{formatearDuracion(l.duracion_s)}</td>
                      <td className="tabular px-3 py-2.5 text-right font-medium text-fj-text">{fmt4(l.coste)}</td>
                      <td className="tabular px-3 py-2.5 text-right text-fj-muted">{fmt4(l.costePorMinuto)}</td>
                      <td className="px-5 py-2.5 text-xs text-fj-muted">
                        {l.productos.length === 0 ? (
                          <span className="text-fj-faint">sin desglose</span>
                        ) : (
                          l.productos.map((p) => `${p.etiqueta} ${fmt4(p.coste)}`).join(" · ")
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>

        <div className="space-y-4">
          <Tarjeta className="p-5">
            <h2 className="text-sm font-semibold text-fj-text">IA por modelo</h2>
            <p className="mb-3 text-xs text-fj-muted">Respuestas del chat y otros usos (partes, transcripciones).</p>
            {r.ia.porModelo.length === 0 ? (
              <p className="text-sm text-fj-faint">
                Sin datos todavía. Se rellena cuando n8n manda el consumo de cada respuesta (ver README, «Gastos de IA»).
              </p>
            ) : (
              <ul className="divide-y divide-fj-border text-sm">
                {r.ia.porModelo.map((m) => (
                  <li key={m.modelo} className="flex items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium text-fj-text">{m.modelo}</p>
                      <p className="text-xs text-fj-muted">
                        {m.n} {m.n === 1 ? "respuesta" : "respuestas"} · {fmtTokens.format(m.tokens)} tokens
                      </p>
                    </div>
                    <span className="tabular font-medium text-fj-text">{fmt4(m.coste)}</span>
                  </li>
                ))}
              </ul>
            )}
            {r.ia.porOrigen.length > 1 && (
              <p className="mt-3 text-xs text-fj-muted">Por origen: {r.ia.porOrigen.map((o) => `${o.origen} ${fmt4(o.coste)}`).join(" · ")}</p>
            )}
          </Tarjeta>

          <Tarjeta className="overflow-hidden">
            <h2 className="px-5 pt-4 text-sm font-semibold text-fj-text">Últimas respuestas de IA</h2>
            <p className="px-5 pb-3 text-xs text-fj-muted">Tokens de entrada / salida y coste.</p>
            {ia.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-fj-faint">Nada registrado en este periodo.</p>
            ) : (
              <ul className="max-h-80 divide-y divide-fj-border overflow-auto border-t border-fj-border text-sm">
                {ia.slice(0, 50).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 px-5 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-fj-text">
                        {formatearCorta(c.created_at)} · {c.origen}
                        {c.modelo && <span className="text-fj-muted"> · {c.modelo}</span>}
                      </p>
                      <p className="tabular text-xs text-fj-muted">
                        {fmtTokens.format(c.tokens_entrada ?? 0)} / {fmtTokens.format(c.tokens_salida ?? 0)} tokens
                      </p>
                    </div>
                    <span className="tabular shrink-0 text-fj-text">{fmt4(numero(c.coste_eur))}</span>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>
      </section>
    </>
  );
}

function Cifra({ titulo, valor, pie, href, destacado = false }: { titulo: string; valor: string | number; pie?: string; href?: string; destacado?: boolean }) {
  const contenido = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-fj-faint">{titulo}</p>
      <p className="tabular mt-1 text-2xl font-semibold leading-none text-fj-navy sm:text-3xl">{valor}</p>
      {pie && <p className="mt-2 text-xs text-fj-muted">{pie}</p>}
    </>
  );
  const clase = `block h-full rounded-xl border p-4 ${destacado ? "border-fj-navy/20 bg-fj-navy-soft" : "border-fj-border bg-fj-surface"} ${href ? "hover:border-fj-border-hi" : ""}`;
  return href ? (
    <Link href={href} className={clase}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}
