"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/**
 * Gráficos del inicio (spec §2.1) con recharts. Una sola serie por gráfico → un solo color (el
 * azul de marca); marcas finas, rejilla recesiva, tooltip por barra (skill dataviz).
 */

const NAVY = "var(--color-fj-navy)";
const GRID = "var(--color-viz-grid)";
const TEXTO = "var(--color-fj-muted)";

function TooltipBarra({ active, payload, label, sufijo }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; sufijo: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-fj-border bg-fj-surface px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-fj-text">{label}</p>
      <p className="tabular text-fj-muted">
        {payload[0].value} {sufijo}
      </p>
    </div>
  );
}

export function GraficoPorTipo({ datos }: { datos: Array<{ nombre: string; n: number }> }) {
  const total = datos.reduce((s, d) => s + d.n, 0);
  if (total === 0) return <p className="py-10 text-center text-sm text-fj-muted">Sin avisos en este periodo.</p>;
  return (
    <div className="h-56" role="img" aria-label={`Avisos por tipo: ${datos.map((d) => `${d.nombre} ${d.n}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: TEXTO }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="nombre" width={128} tick={{ fontSize: 12, fill: TEXTO }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "rgba(0,46,98,0.05)" }} content={<TooltipBarra sufijo="avisos" />} />
          <Bar dataKey="n" fill={NAVY} radius={[0, 4, 4, 0]} maxBarSize={18} label={{ position: "right", fontSize: 11, fill: TEXTO }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraficoPorHora({ datos }: { datos: number[] }) {
  const filas = datos.map((n, h) => ({ hora: `${h.toString().padStart(2, "0")}h`, n }));
  const total = datos.reduce((s, d) => s + d, 0);
  if (total === 0) return <p className="py-10 text-center text-sm text-fj-muted">Sin avisos en este periodo.</p>;
  return (
    <div className="h-56" role="img" aria-label="Avisos por hora del día">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={filas} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="hora" interval={2} tick={{ fontSize: 11, fill: TEXTO }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: TEXTO }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "rgba(0,46,98,0.05)" }} content={<TooltipBarra sufijo="avisos" />} />
          <Bar dataKey="n" fill={NAVY} radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
