# Fojansa · Panel y CRM de avisos

## Qué es

Panel para **Instalaciones Fojansa** (Vitoria): métricas de llamadas/chats, bandeja de avisos con
grabación y "Pasado al programa", contactos (CRM ligero de los dos canales), comunidades con
importación CSV, partes por audio (validar/corregir/descartar) y chat estilo WhatsApp que prueba
el asistente. Demo el **jue 9-oct-2026**; base de la fase 1. Interlocutor: Guillermo Mendoza.

## Documentos que mandan (ORKESTA - JARVIS, solo lectura)

`02_CLIENTS/INDUSTRY/instalaciones-fojansa/technical/`:

- `fojansa_panel-spec_v1_2026-10-07.md` — **la spec**. No ampliar el alcance (§5 fuera de la v1).
- `fojansa_demo-kit_v1_2026-10-07.md` — flujos n8n, tablas, guion de la demo.
- `fojansa_agente-voz_spec_v1_2026-10-07.md` — significado de cada campo del aviso.

## Stack

Next.js 15 (App Router) + React 19 + Tailwind 4 + TypeScript + Recharts. Clerk. Supabase
`ORKESTA_OPS_2026` (`ddruuldwacxvvhvhjomm`), tablas `fojansa_avisos`, `fojansa_contactos`,
`fojansa_comunidades`, `fojansa_partes`: RLS activo sin políticas → **solo `service_role` desde el
servidor**, nunca en `NEXT_PUBLIC_*`. Vitest. Docker (`output: "standalone"`) para producción en el
servidor del cliente; Vercel solo para la demo (`fojansa.orkestaia.com`).
Repo `github.com/Orkestaia/Fojansa_panel` (lo creó Aitor el 7-oct; **es público**: no subir nada sensible).

Marca (del logo de fojansa.com): azul marino `#002e62`, cian `#40c4dd`, modo claro, Inter autoalojada.
Tokens en `src/app/globals.css`; ningún color hardcodeado en componentes. Pie: "con tecnología de Orkesta".
Gráficos: una serie = azul de marca; voz/chat = `#2a78d6` / `#1baf7a` (paleta validada con `dataviz`).

## Estructura

- `src/lib/` — lógica pura con tests: `euskera.ts` (§2.7), `fechas.ts` (Europe/Madrid, periodos),
  `metricas.ts`, `csv.ts`, `gomanage.ts`, `contactos.ts` (vinculación, estado derivado), `tipos.ts`
  (= CHECKs de la BD), `etiquetas.ts`, `esquemas.ts` (zod de las APIs), `acceso.ts`, `supabase.ts`.
- `src/lib/datos/` — acceso a Supabase (server-only): avisos, contactos, comunidades, partes, metricas.
- `src/app/(panel)/(app)/` — pantallas; `src/app/api/` — route handlers (spec §3).
- `src/components/` — UI compartida (`ui.tsx`), filtros, acciones, gráficos, chat.
- `scripts/seed-demo.ts` — datos de demo repetibles (`call_id` `demo-*`, `raw.seed`).
- `docs/QA-CHECKLIST.md` — checklist de la spec §6.

## Estado (8-oct-2026, mediodía)

**Construido entero, verificado en local y en producción** (`fojansa-panel.vercel.app`, equipo
`orkesta-automation`, proyecto `fojansa-panel`; despliega con cada push a `main`). 42 tests, tsc y
eslint limpios. Seed de demo en OPS (15 avisos, 6 partes, 16 respuestas de IA).

**8-oct, segunda ronda (pedida por Aitor):** pantalla `/gastos` (desglose de Retell por producto,
€/min, gasto por día, IA por modelo), botón «ver» en todas las listas, rótulo «Panel de avisos» ya
no parece botón, mapas de Google en avisos y comunidades, franja de color por tipo en la bandeja,
columna/campo «Derivado a» (migración `fojansa_panel_derivacion_y_costes_ia`: `derivado_a`,
`derivado_at` y tabla `fojansa_costes_ia`), bandeja en tarjetas en móvil.

Pendiente de Aitor: crear la app de Clerk "Fojansa Panel" (registro cerrado, dos usuarios: Guillermo
y oficina) y poner sus dos claves en Vercel; CNAME `fojansa` → `cname.vercel-dns.com` en Namecheap;
decidir si n8n manda el consumo de tokens (`uso` en la respuesta del chat o `POST /api/costes`) y si
escribe `derivado_a` al transferir. El MCP de Vercel no tiene acceso al equipo: usar la CLI `npx vercel`.

## Reglas específicas

- Datos reales de prueba en `fojansa_avisos` (Retell, chat) y 5 comunidades sembradas por JARVIS:
  no borrarlos. El seed solo toca filas `demo-*`.
- `acceso.ts`: sin claves de Clerk solo abre en `NODE_ENV=development` (usuario "Desarrollo");
  en producción se rechaza todo. `PANEL_EMAILS_PERMITIDOS` opcional. `FOJANSA_API_TOKEN` (≥32
  caracteres) para `POST /api/avisos/vincular` desde n8n.
- Vinculación de contactos: al abrir la bandeja se vinculan los avisos sin `contacto_id`; además
  existe la ruta con token para n8n.
- `direccion_normalizada` de comunidades es GENERATED ALWAYS: no se escribe nunca.
- Los `silencio` no cuentan como aviso en el % de satisfactorios.
- Todo en español, nombres humanos (`etiquetas.ts`). Mostrar siempre la grafía original.
- Nada específico de Vercel salvo el hosting.
- Hermes/JARVIS escriben en la misma Supabase: antes de "arreglar" un dato raro, comprobar si es de
  una prueba suya (p. ej. "3� izquierda" viene de n8n, no del panel).

## Cómo ejecutar / testear / desplegar

`npm run dev` · `npm test` · `npx tsc --noEmit` · `npm run lint` · `npm run seed:demo` ·
Docker: ver README. Preview en el workspace: configuración `fojansa-panel` de `.claude/launch.json` (puerto 3017).
