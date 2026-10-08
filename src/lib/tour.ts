/**
 * Pasos del tour de bienvenida (onboarding). Cada paso vive en una ruta y señala un elemento con
 * `data-tour="…"`. El componente `Tour` navega entre rutas, espera a que el elemento exista y lo
 * resalta. Los pasos del detalle del aviso necesitan un aviso real: `ruta` lleva `{aviso}`.
 *
 * Textos cortos y en el lenguaje de oficina: dos frases por paso.
 */

export interface PasoTour {
  /** Ruta de la página; `{aviso}` se sustituye por el id del aviso más reciente. */
  ruta: string;
  /** Valor de `data-tour` del elemento a resaltar. */
  objetivo: string;
  titulo: string;
  texto: string;
  /** Lado de la burbuja. */
  lado?: "top" | "bottom" | "left" | "right";
}

export const PASOS_TOUR: PasoTour[] = [
  {
    ruta: "/",
    objetivo: "nav",
    titulo: "Bienvenido al panel de avisos",
    texto: "Estas son las secciones. Las recorremos en un minuto: puedes pulsar Siguiente, volver atrás o saltar el tour cuando quieras.",
    lado: "bottom",
  },
  {
    ruta: "/",
    objetivo: "inicio-periodo",
    titulo: "Elige el periodo",
    texto: "Hoy, 7 días, 30 días o la temporada de calefacción (del 1 de octubre al 30 de abril). Todas las cifras de esta pantalla cambian con él.",
    lado: "bottom",
  },
  {
    ruta: "/",
    objetivo: "inicio-cifras",
    titulo: "Lo de hoy de un vistazo",
    texto: "Llamadas y chats atendidos, el porcentaje con todos los datos completos, lo que queda por revisar, las urgencias y lo que ha costado. Las tarjetas naranja y roja se pulsan y abren la lista ya filtrada.",
    lado: "bottom",
  },
  {
    ruta: "/",
    objetivo: "inicio-horas",
    titulo: "Cuándo entran las llamadas",
    texto: "Por hora del día. Lo que cae fuera del horario de oficina es justo lo que antes se perdía y ahora queda registrado.",
    lado: "top",
  },
  {
    ruta: "/avisos",
    objetivo: "avisos-filtros",
    titulo: "La bandeja de avisos",
    texto: "Cada fila es una llamada o un chat; aparecen solos al colgar, sin recargar. Filtra por estado, canal, tipo o fechas, y busca por dirección, nombre o teléfono (entiende Goicoechea por Goikoetxea).",
    lado: "bottom",
  },
  {
    ruta: "/avisos",
    objetivo: "avisos-leyenda",
    titulo: "Los colores",
    texto: "La franja de la izquierda de cada fila dice de qué va: rojo urgente, azul avería, cian recibo, gris el resto. Las urgencias además van sobre fondo rojizo.",
    lado: "bottom",
  },
  {
    ruta: "/avisos",
    objetivo: "avisos-fila",
    titulo: "Abrir un aviso",
    texto: "Pulsa el ojo del final de la fila (o la fecha, o la dirección) para ver el detalle. Vamos a abrir el más reciente.",
    lado: "left",
  },
  {
    ruta: "/avisos/{aviso}",
    objetivo: "aviso-acciones",
    titulo: "Qué hacer con un aviso",
    texto: "Cuando lo hayas metido en Go!Manage, pulsa «Pasado al programa»: queda apuntado quién y cuándo. Si algo no cuadra, «Marcar para revisar» con el motivo; si no hacía falta nada, «Cerrar».",
    lado: "left",
  },
  {
    ruta: "/avisos/{aviso}",
    objetivo: "aviso-gomanage",
    titulo: "Copiar para Go!Manage",
    texto: "Un solo botón copia los datos en el orden en que se teclean en el programa: dirección, piso, nombre, teléfono, tipo y descripción. Pégalos y listo.",
    lado: "left",
  },
  {
    ruta: "/avisos/{aviso}",
    objetivo: "aviso-grabacion",
    titulo: "La grabación",
    texto: "Si quieres oír lo que dijo el vecino, aquí está la llamada entera, con la transcripción plegada debajo y el coste de esa llamada.",
    lado: "top",
  },
  {
    ruta: "/contactos",
    objetivo: "contactos-tabla",
    titulo: "Quién ha llamado",
    texto: "Los contactos se crean solos con cada aviso que trae teléfono. El estado sale de la comunidad: pagos pendientes, sin contrato o activo. Pulsa un nombre para ver su historial de llamadas y chats.",
    lado: "top",
  },
  {
    ruta: "/comunidades",
    objetivo: "comunidades-importar",
    titulo: "Vuestra lista de comunidades",
    texto: "Con esta lista el asistente reconoce las direcciones. Importa el CSV exportado de Go!Manage (direccion, nombre, administrador, contrato vigente, pagos al día) y mantenla al día. Se puede editar pulsando una fila.",
    lado: "bottom",
  },
  {
    ruta: "/partes",
    objetivo: "partes-resumen",
    titulo: "Partes por audio",
    texto: "Los operarios mandan una nota de voz en su idioma y aquí aparece el parte en español. Arriba, las horas y unidades por obra; abajo, cada parte con sus botones Validar, Corregir y Descartar.",
    lado: "bottom",
  },
  {
    ruta: "/chat",
    objetivo: "chat-caja",
    titulo: "Probar el asistente",
    texto: "El mismo cerebro que atiende el teléfono, por escrito. Escribe como lo haría un vecino y, cuando cierre el aviso, lo verás en la bandeja. En producción será WhatsApp.",
    lado: "top",
  },
  {
    ruta: "/gastos",
    objetivo: "gastos-cifras",
    titulo: "Lo que cuesta",
    texto: "Cada llamada con su coste y el desglose (motor de voz, voz sintética, modelo de lenguaje, telefonía), el gasto por día y lo que cuestan las respuestas del chat.",
    lado: "bottom",
  },
  {
    ruta: "/gastos",
    objetivo: "menu-usuario",
    titulo: "Y esto es todo",
    texto: "Desde tu nombre, arriba a la derecha, tienes la guía de usuario completa (con el asistente de voz explicado y una llamada de ejemplo) y puedes volver a ver este tour cuando quieras.",
    lado: "bottom",
  },
];

/** Sustituye `{aviso}` por el id real. Si no hay aviso, los pasos del detalle se quitan. */
export function resolverPasos(pasos: PasoTour[], avisoId: string | null): PasoTour[] {
  return pasos
    .filter((p) => avisoId || !p.ruta.includes("{aviso}"))
    .map((p) => ({ ...p, ruta: p.ruta.replace("{aviso}", avisoId ?? "") }));
}

/** Clave de sessionStorage con el paso en curso (sobrevive a la navegación entre rutas). */
export const CLAVE_PASO_TOUR = "fojansa_tour_paso";
/** Clave de localStorage con "ya lo vi" cuando no hay Clerk (desarrollo). */
export const CLAVE_TOUR_VISTO = "fojansa_tour_visto";
/** Evento para arrancar el tour desde el menú del usuario. */
export const EVENTO_TOUR = "fojansa:tour";
