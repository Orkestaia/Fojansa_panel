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

Next.js 15 (App Router) + React 19 + Tailwind 4 + TypeScript. Clerk (**proyecto de Clerk aún no
creado: avisar a Aitor antes**). Supabase `ORKESTA_OPS_2026` (`ddruuldwacxvvhvhjomm`), tablas
`fojansa_avisos`, `fojansa_contactos`, `fojansa_comunidades`, `fojansa_partes`: RLS activo sin
políticas → **solo `service_role` desde el servidor**, nunca en `NEXT_PUBLIC_*`. Recharts para
gráficos (paleta validada con la skill `dataviz`: 1 serie = azul marino de marca; voz/chat =
`#2a78d6` / `#1baf7a`). Vitest. Docker (`output: "standalone"`) para producción en el servidor del
cliente; Vercel solo para la demo (`fojansa.orkestaia.com`, **proyecto aún no creado: avisar**).
Repo previsto `Orkestaia/fojansa-panel` (no creado; `gh` no está instalado, usar la API con el token de `secrets/`).

Marca (sacada del logo de fojansa.com): azul marino `#002e62`, cian de la gota `#40c4dd`, modo
claro, Inter autoalojada (`src/app/fonts/`). Logo en `public/fojansa-logo.png`. Pie: "con
tecnología de Orkesta".

## Estado (7-oct-2026, 20:00)

Hecho: scaffold (configs, Dockerfile, .gitignore), capa `src/lib/` con tests:
`tipos.ts` (tipos = CHECKs de la BD), `etiquetas.ts`, `euskera.ts` (§2.7: tx↔ch, tz↔ts, k↔c/qu,
z↔s, b↔v, h muda), `fechas.ts` (Europe/Madrid, periodos hoy/7d/30d/temporada = 1-oct→30-abr),
`metricas.ts` (§2.1; los `silencio` no cuentan como aviso), `csv.ts` (importación comunidades con
alias de columnas), `gomanage.ts` (texto "Copiar para Go!Manage"), `contactos.ts` (vinculación por
teléfono, tipo deducido, estado derivado de la comunidad), `supabase.ts`, `acceso.ts`.

**`npm install` falló a medias** (ENOTEMPTY en `node_modules/next/dist`: dos instalaciones se
pisaron en OneDrive). Primer paso de la próxima sesión:

```bash
rm -rf node_modules && npm install --no-audit --no-fund && npx vitest run
```

Pendiente, en el orden que pidió Aitor: `scripts/seed-demo.ts` (§4: 12-15 avisos 7 días, 6 partes
en 3 idiomas y 2 obras, direcciones de las 5 comunidades) → `src/app` (layout con Clerk, globals.css
con tokens de marca, middleware) → bandeja + detalle + polling 10 s → inicio con métricas → contactos
y comunidades (CSV) → partes → chat (`POST /api/chat` → `N8N_CHAT_WEBHOOK_URL`, respuesta
`{respuesta, session_id, aviso_registrado}`; probado con curl, funciona) → README, `.env.example`,
checklist QA §6 → repo, Clerk, Vercel.

## Reglas específicas

- Datos reales de prueba ya en `fojansa_avisos` (5 filas de voz y chat) y 5 comunidades: no
  borrarlos; el seed añade, no sustituye (idempotente por `call_id` con prefijo `demo-`).
- `acceso.ts`: sin claves de Clerk solo abre en `NODE_ENV=development` (usuario "Desarrollo");
  en producción se rechaza todo. `PANEL_EMAILS_PERMITIDOS` opcional. `FOJANSA_API_TOKEN` (≥32
  caracteres) para `POST /api/avisos/vincular` desde n8n.
- Vinculación de contactos: al abrir la bandeja se vinculan los avisos sin `contacto_id` (más
  simple para la demo) y además existe la ruta con token.
- Todo en español, nombres de campo humanos (`etiquetas.ts`). Mostrar siempre la grafía original.
- Nada específico de Vercel salvo el hosting.

## Cómo ejecutar / testear / desplegar

`npm run dev` (puerto 3000) · `npm test` · `npm run seed:demo` (necesita `.env.local`) ·
`npm run build && npm start` · Docker: `docker build -t fojansa-panel . && docker run -p 3000:3000 --env-file .env fojansa-panel`.
Variables: ver `.env.example`.
