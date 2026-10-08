"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const NAVY = "var(--color-fj-navy)";
const VOZ = "var(--color-viz-voz)";
const IA = "var(--color-viz-chat)";
const GRID = "var(--color-viz-grid)";
const TEXTO = "var(--color-fj-muted)";

const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n);

function TooltipEuros({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-fj-border bg-fj-surface px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-fj-text">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="tabular text-fj-muted">
          {p.name}: {eur(p.value)}
        </p>
      ))}
    </div>
  );
}

export function GraficoPorProducto({ datos }: { datos: Array<{ nombre: string; coste: number; porcentaje: number }> }) {
  if (datos.length === 0) return <p className="py-10 text-center text-sm text-fj-muted">Ninguna llamada trae desglose en este periodo.</p>;
  const filas = datos.map((d) => ({ ...d, etiqueta: `${Math.round(d.porcentaje)} %` }));
  return (
    <div className="h-56" role="img" aria-label={`Coste por producto: ${datos.map((d) => `${d.nombre} ${eur(d.coste)}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={filas} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 8 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" tick={{ fontSize: 11, fill: TEXTO }} axisLine={false} tickLine={false} tickFormatter={(v: number) => eur(v)} />
          <YAxis type="category" dataKey="nombre" width={170} tick={{ fontSize: 12, fill: TEXTO }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "rgba(0,46,98,0.05)" }} content={<TooltipEuros />} />
          <Bar dataKey="coste" name="Coste" fill={NAVY} radius={[0, 4, 4, 0]} maxBarSize={18} label={{ position: "right", fontSize: 11, fill: TEXTO, dataKey: "etiqueta" }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraficoPorDia({ datos }: { datos: Array<{ dia: string; voz: number; ia: number; llamadas: number }> }) {
  if (datos.length === 0) return <p className="py-10 text-center text-sm text-fj-muted">Sin gasto en este periodo.</p>;
  const filas = datos.map((d) => ({ ...d, etiqueta: d.dia.slice(8, 10) + "/" + d.dia.slice(5, 7) }));
  return (
    <div className="h-56" role="img" aria-label="Gasto por día, voz e IA">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={filas} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={4}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fill: TEXTO }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11, fill: TEXTO }} axisLine={false} tickLine={false} tickFormatter={(v: number) => eur(v)} width={64} />
          <Tooltip cursor={{ fill: "rgba(0,46,98,0.05)" }} content={<TooltipEuros />} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, color: "var(--color-fj-muted)" }} />
          <Bar dataKey="voz" name="Voz" stackId="g" fill={VOZ} maxBarSize={26} />
          <Bar dataKey="ia" name="IA" stackId="g" fill={IA} maxBarSize={26} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
