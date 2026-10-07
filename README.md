# Fojansa · Panel y CRM de avisos

Panel para **Instalaciones Fojansa** (Vitoria-Gasteiz): métricas de llamadas y chats atendidos por el
asistente, bandeja de avisos con grabación y "Pasado al programa", contactos (CRM ligero de los dos
canales), comunidades con importación CSV, partes de trabajo por audio y un chat estilo WhatsApp para
probar el asistente. Construido por Orkesta Automatización & IA.

Spec: `ORKESTA - JARVIS/02_CLIENTS/INDUSTRY/instalaciones-fojansa/technical/fojansa_panel-spec_v1_2026-10-07.md`.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 4 · Recharts
- Clerk (acceso) · Supabase `ORKESTA_OPS_2026` (datos, solo `service_role` desde el servidor)
- n8n (los avisos entran por los flujos de voz, chat y partes; el chat del panel reenvía al webhook)
- Vitest · Docker (`output: "standalone"`) para el servidor del cliente; Vercel solo para la demo

## Pantallas

| Ruta | Qué hay |
|---|---|
| `/` | Inicio: atendidos (voz/chat), % satisfactorios, para revisar, urgentes, coste total y medio, duración media, por tipo, por hora, partes de hoy. Periodo: hoy / 7 días / 30 días / temporada |
| `/avisos` | Bandeja con filtros (estado, canal, tipo, urgente, fechas, texto libre tolerante a euskera). Se refresca sola cada 10 s. Al abrirla vincula los avisos sin contacto |
| `/avisos/[id]` | Detalle: todos los campos, grabación, transcripción, comunidad reconocida, contacto, acciones (Pasado al programa, Cerrar, Marcar para revisar, Abrir contacto) y "Copiar para Go!Manage" |
| `/contactos`, `/contactos/[id]`, `/contactos/nuevo` | CRM ligero: estado derivado de la comunidad (pagos pendientes / sin contrato), historial de avisos, partes si es obra, notas |
| `/comunidades` | Lista editable inline + importar CSV (`direccion, nombre, administrador, contrato_vigente, pagos_al_dia`) |
| `/partes`, `/partes/[id]` | Partes por audio: filtros por obra/estado/fecha, resumen por obra (horas y unidades), transcripción original y en español, Validar / Corregir / Descartar |
| `/chat` | "Probar el asistente": interfaz WhatsApp, `session_id` nuevo por carga, toast "Aviso registrado" |

## API interna (route handlers, todas con sesión de Clerk)

`GET /api/metricas?periodo=` · `GET /api/avisos` · `GET/PATCH /api/avisos/:id` ·
`POST /api/avisos/vincular` (sesión **o** `Authorization: Bearer FOJANSA_API_TOKEN`, para n8n) ·
`GET/POST /api/contactos` · `GET/PATCH /api/contactos/:id` · `GET/POST /api/comunidades` ·
`GET/PATCH /api/comunidades/:id` · `POST /api/comunidades/importar` (multipart `archivo`) ·
`GET /api/partes` · `GET/PATCH /api/partes/:id` · `POST /api/chat` · `GET /api/salud`.

## Variables de entorno

Ver [`.env.example`](.env.example) (sin valores). Resumen:

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk. Sin ellas, **solo en desarrollo** el panel abre con un usuario "Desarrollo"; en producción se rechaza todo |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/` | Rutas de Clerk |
| `PANEL_EMAILS_PERMITIDOS` | Opcional. Emails (coma) que pueden entrar además de tener sesión |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase, solo servidor. Nunca `NEXT_PUBLIC_*` |
| `N8N_CHAT_WEBHOOK_URL`, `N8N_CHAT_TOKEN` | Webhook del chat (`/webhook/fojansa-chat`) y token opcional (`x-orkesta-token`) |
| `FOJANSA_API_TOKEN` | Bearer para que n8n llame a `POST /api/avisos/vincular`. Mín. 32 caracteres |

## Ejecutar en local

```bash
npm install
cp .env.example .env.local   # rellenar SUPABASE_* (y Clerk si se quiere probar el login)
npm run dev                  # http://localhost:3000
```

## Testear

```bash
npm test          # vitest: euskera, métricas, CSV, Go!Manage, reglas del CRM
npx tsc --noEmit  # tipos
npm run lint
```

Checklist de QA manual de la spec §6: [`docs/QA-CHECKLIST.md`](docs/QA-CHECKLIST.md).

## Datos de demo

```bash
npm run seed:demo             # 14 avisos (7 días) + 6 partes (3 idiomas, 2 obras). Repetible.
npm run seed:demo -- --borrar # solo borra los datos demo
```

Las filas demo llevan `call_id` `demo-*` y `raw.seed = "demo"`; las reales (Retell, chat, Telegram)
no se tocan. Los contactos se crean solos al abrir la bandeja.

## Desplegar

### Vercel (demo, `fojansa.orkestaia.com`)

Proyecto Vercel conectado al repo `Orkestaia/Fojansa_panel`; cada push a `main` despliega.
Variables de entorno en Project Settings → Environment Variables (las sensibles como *Sensitive*).
Dominio: CNAME `fojansa` → `cname.vercel-dns.com` en el DNS de orkestaia.com.

### Docker (producción, servidor de Fojansa)

```bash
docker build --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_... -t fojansa-panel .
docker run -d --name fojansa-panel -p 3000:3000 --env-file .env --restart unless-stopped fojansa-panel
curl http://localhost:3000/api/salud
```

`.env` con las variables de la tabla (sin comillas). Delante, un proxy inverso con TLS (Caddy, Traefik
o Nginx). Nada del código depende de Vercel.

## Decisiones

- **`service_role` solo en el servidor.** Las tablas tienen RLS sin políticas: el navegador nunca
  habla con Supabase. `server-only` rompe el build si un componente cliente importa `lib/supabase.ts`.
- **Polling, no realtime.** `router.refresh()` cada 10 s en la bandeja (15 s en detalle y partes,
  30 s en inicio). Suficiente para "la fila aparece sola al colgar" y sin websockets que mantener.
- **Búsqueda tolerante a euskera en memoria** (`lib/euskera.ts`): tx↔ch, tz↔ts, k↔c/qu, z↔s, b↔v,
  h muda, sin tildes. Se aplica a ambos lados; se muestra siempre la grafía original.
- **Los silencios no cuentan como aviso** en el % de satisfactorios (spec del agente §3.S).
- **Estado del contacto derivado** de su comunidad (`pagos_al_dia` → pago pendiente, `contrato_vigente`
  → sin contrato) y, si no, del contrato del particular; el estado "a mano" se respeta cuando la
  comunidad está al día.
- **`direccion_normalizada`** es una columna generada en la BD: nunca se escribe desde el panel.
