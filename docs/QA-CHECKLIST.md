# Checklist de QA · Fojansa Panel (spec §6)

Fecha: ____ · Entorno: ☐ local ☐ fojansa.orkestaia.com · Probado por: ____

Antes: `npm run seed:demo` ejecutado y los flujos de n8n (voz, chat, partes) publicados.

## 1. Cada pantalla con los datos sembrados

| # | Comprobación | OK |
|---|---|---|
| 1.1 | `/` muestra atendidos > 0, % satisfactorios, para revisar, urgentes, coste total y medio, duración media | ☐ |
| 1.2 | Cambiar periodo Hoy / 7 días / 30 días / Temporada cambia las cifras y los gráficos | ☐ |
| 1.3 | "Por tipo" y "Por hora" pintan barras; el tooltip sale al pasar el ratón | ☐ |
| 1.4 | "Para revisar" enlaza a `/avisos?estado=revisar` y "Urgentes" a `/avisos?urgente=1` | ☐ |
| 1.5 | `/avisos` lista 19+ filas con fecha, canal (icono), tipo, urgente, dirección+piso, nombre, teléfono, datos completos, estado, coste | ☐ |
| 1.6 | Filtros: estado, canal (voz/chat), tipo, solo urgentes, desde/hasta, texto libre. "Quitar filtros" los limpia | ☐ |
| 1.7 | Buscar `goicoechea` encuentra "Vicente Goikoetxea"; `sabalgana` encuentra "Zabalgana" (euskera, §2.7) | ☐ |
| 1.8 | Detalle de un aviso de voz: reproduce la grabación, transcripción plegable, comunidad reconocida con enlace, coste y duración | ☐ |
| 1.9 | Detalle de un aviso particular (demo-chat-03): se ven marca, modelo, antigüedad y contrato | ☐ |
| 1.10 | Detalle de un recibo: lectura comprobada y email | ☐ |
| 1.11 | "Pasado al programa" → estado cambia, aparece "por <usuario> el <fecha>"; "Deshacer" lo revierte | ☐ |
| 1.12 | "Marcar para revisar" sin motivo no deja guardar; con motivo pasa a Revisar y la bandeja lo muestra | ☐ |
| 1.13 | "Copiar para Go!Manage" copia el bloque en el orden dirección, piso, nombre, teléfono, tipo, descripción | ☐ |
| 1.14 | "Abrir contacto" abre la ficha del contacto creado automáticamente por teléfono | ☐ |
| 1.15 | `/contactos`: contactos con comunidad enlazada; Portal de Gamarra 1 → "Pago pendiente"; Los Herrán 40 → "Sin contrato" | ☐ |
| 1.16 | Ficha del contacto: editar nombre/notas y guardar; el historial muestra voz y chat juntos | ☐ |
| 1.17 | `/contactos/nuevo` crea un contacto y redirige a su ficha | ☐ |
| 1.18 | `/comunidades`: 5 comunidades; pulsar una fila permite editar inline; guardar y cancelar funcionan | ☐ |
| 1.19 | Importar CSV (`;` o `,`, con "Sí/No") crea las nuevas y actualiza las existentes; muestra descartadas | ☐ |
| 1.20 | `/partes`: 6+ partes, resumen por obra (horas y unidades), filtro por obra y estado | ☐ |
| 1.21 | Detalle de un parte: transcripción original y en español lado a lado; idioma visible | ☐ |
| 1.22 | Validar / Corregir / Descartar cambian el estado y guardan quién y cuándo | ☐ |
| 1.23 | Pie "con tecnología de Orkesta"; logo de Fojansa en la cabecera; todo en español | ☐ |
| 1.24 | En tablet (≈ 800-1024 px) la navegación baja a una segunda fila y las tablas se desplazan horizontalmente sin romper | ☐ |

## 2. Una llamada real de Retell aparece sola en la bandeja en menos de 15 s

| # | Comprobación | OK |
|---|---|---|
| 2.1 | Con `/avisos` abierto, llamar al número de prueba y hacer el guion de comunidad | ☐ |
| 2.2 | Al colgar, la fila aparece sin recargar en < 15 s (polling 10 s + webhook) | ☐ |
| 2.3 | La fila trae coste, duración, grabación y comunidad reconocida | ☐ |
| 2.4 | En `/` sube "Atendidos" y el coste total | ☐ |
| 2.5 | Al abrir la bandeja se ha creado/enlazado el contacto por teléfono | ☐ |

## 3. El chat registra un aviso

| # | Comprobación | OK |
|---|---|---|
| 3.1 | `/chat`: el asistente responde al primer mensaje | ☐ |
| 3.2 | Completar el guion de particular (marca, antigüedad, contrato, dirección, teléfono, nombre) | ☐ |
| 3.3 | Al cerrar, toast "Aviso registrado" y enlace "ver en la bandeja" | ☐ |
| 3.4 | En `/avisos?canal=chat` está la fila con canal Chat y los campos de particular | ☐ |
| 3.5 | "Nueva conversación" reinicia con otro `session_id` | ☐ |

## 4. Un parte cambia de estado

| # | Comprobación | OK |
|---|---|---|
| 4.1 | Mandar una nota de voz al bot de partes (rumano/portugués) → aparece en `/partes` en español | ☐ |
| 4.2 | Validar → "Validado", con revisado_por y revisado_at | ☐ |
| 4.3 | Corregir las horas → "Corregido" y el resumen por obra se actualiza | ☐ |
| 4.4 | Descartar → sale del resumen por obra; "Recuperar" lo devuelve a pendiente | ☐ |

## 5. Seguridad

| # | Comprobación | OK |
|---|---|---|
| 5.1 | Sin sesión, `/` redirige a `/sign-in` y `/api/avisos` devuelve 401 | ☐ |
| 5.2 | `POST /api/avisos/vincular` sin Bearer → 401; con `FOJANSA_API_TOKEN` → 200 | ☐ |
| 5.3 | Ninguna clave en el HTML servido (`view-source`, buscar `service_role`, `eyJ`) | ☐ |
| 5.4 | Cabecera `X-Robots-Tag: noindex` presente | ☐ |
