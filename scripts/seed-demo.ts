/**
 * Datos de demo (spec §4): 14 avisos de los últimos 7 días (voz y chat, con `revisar`, un urgente,
 * costes 0,15-0,30 €, duraciones 60-240 s) y 6 partes (3 idiomas, 2 obras). Repetible: todo lleva
 * `call_id` / `raw.seed` con prefijo `demo-` y se borra y vuelve a crear en cada ejecución; las
 * filas reales (llamadas de Retell, chats) no se tocan. Direcciones de las 5 comunidades sembradas,
 * nombres y teléfonos inventados.
 *
 *   npm run seed:demo            (lee .env.local)
 *   npm run seed:demo -- --borrar  (solo borra los datos demo)
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config();

const url = process.env.SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (.env.local)");
  process.exit(1);
}
const sb = createClient(url, clave, { auth: { persistSession: false } });
const PREFIJO = "demo-";
const soloBorrar = process.argv.includes("--borrar");

// Horas de Vitoria → ISO. Octubre 2026 es horario de verano (UTC+2) hasta el 25-oct.
function fecha(diasAtras: number, hora: number, minuto = 0): string {
  const ahora = new Date();
  const d = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate() - diasAtras, hora - 2, minuto, 0));
  return d.toISOString();
}
function fechaDia(diasAtras: number): string {
  const d = new Date(Date.now() - diasAtras * 86_400_000);
  return d.toISOString().slice(0, 10);
}

interface Com {
  id: string;
  direccion: string;
}

async function comunidades(): Promise<Record<string, Com>> {
  const { data, error } = await sb.from("fojansa_comunidades").select("id, direccion");
  if (error) throw error;
  const m: Record<string, Com> = {};
  for (const c of data as Com[]) m[c.direccion] = c;
  const necesarias = ["Fernando Maturana 24", "Fernando Maturana 22", "Los Herrán 40", "Pintor Vera Fajardo 6", "Portal de Gamarra 1"];
  for (const n of necesarias) if (!m[n]) throw new Error(`Falta la comunidad sembrada "${n}"`);
  return m;
}

async function borrar() {
  const a = await sb.from("fojansa_avisos").delete().like("call_id", `${PREFIJO}%`).select("id");
  if (a.error) throw a.error;
  const p = await sb.from("fojansa_partes").delete().contains("raw", { seed: "demo" }).select("id");
  if (p.error) throw p.error;
  // Contactos creados por la vinculación de avisos demo (teléfonos 6000000xx).
  const c = await sb.from("fojansa_contactos").delete().like("telefono", "6000000%").select("id");
  if (c.error) throw c.error;
  console.log(`Borrados: ${a.data?.length ?? 0} avisos, ${p.data?.length ?? 0} partes, ${c.data?.length ?? 0} contactos demo`);
}

async function sembrar() {
  const com = await comunidades();
  const grab = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; // audio público de prueba

  const voz = (n: number, extra: Record<string, unknown>) => ({
    canal: "voz",
    call_id: `${PREFIJO}voz-${n.toString().padStart(2, "0")}`,
    url_grabacion: grab,
    estado: "nuevo",
    datos_completos: true,
    urgente: false,
    alcance: "individual",
    comunidad_reconocida: true,
    repetida: false,
    raw: { seed: "demo" },
    ...extra,
  });
  const chat = (n: number, extra: Record<string, unknown>) => ({
    canal: "web",
    call_id: `${PREFIJO}chat-${n.toString().padStart(2, "0")}`,
    estado: "nuevo",
    datos_completos: true,
    urgente: false,
    comunidad_reconocida: null,
    repetida: false,
    duracion_s: null,
    coste_eur: null,
    raw: { seed: "demo" },
    ...extra,
  });

  const avisos = [
    voz(1, {
      created_at: fecha(6, 8, 12),
      tipo: "averia_comunidad",
      tipo_averia: "calefaccion",
      descripcion: "Radiadores fríos en toda la vivienda",
      direccion: "Fernando Maturana 24",
      piso: "3º izquierda",
      alcance: "individual",
      nombre: "Miren Etxebarria",
      telefono: "600000011",
      desde_cuando: "desde ayer por la noche",
      resumen: "Vecina de Fernando Maturana 24, 3º izquierda, sin calefacción desde anoche. A los vecinos les funciona. Confirmados dirección y teléfono.",
      duracion_s: 152,
      coste_eur: 0.2275,
      comunidad_id: com["Fernando Maturana 24"].id,
      estado: "pasado_al_programa",
      pasado_por: "Oficina",
      pasado_at: fecha(6, 9, 5),
    }),
    voz(2, {
      created_at: fecha(6, 11, 40),
      tipo: "recibo",
      tipo_averia: "recibo_acs",
      descripcion: "Recibo de agua caliente muy alto este mes",
      direccion: "Pintor Vera Fajardo 6",
      piso: "1º B",
      nombre: "Jose Luis Goikoetxea",
      telefono: "600000012",
      lectura_comprobada: "no",
      email: "jl.goikoetxea@example.com",
      resumen: "Recibo de ACS que considera excesivo. No ha comprobado la lectura. Se le ha indicado escribir a lecturas@fojansa.com.",
      duracion_s: 118,
      coste_eur: 0.1766,
      comunidad_id: com["Pintor Vera Fajardo 6"].id,
      estado: "cerrado",
    }),
    chat(3, {
      created_at: fecha(5, 17, 20),
      tipo: "averia_particular",
      tipo_averia: "caldera",
      descripcion: "La caldera se apaga sola y marca error E10",
      direccion: "Calle Txagorritxu 8",
      piso: "4º derecha",
      nombre: "Ainhoa Zabala",
      telefono: "600000013",
      marca: "Vaillant",
      modelo: "ecoTEC plus",
      antiguedad: "7 años",
      contrato_mantenimiento: "no",
      resumen: "Particular con caldera Vaillant de 7 años sin contrato. Se apaga con error E10. Pide visita del técnico.",
      comunidad_reconocida: false,
    }),
    voz(4, {
      created_at: fecha(5, 19, 55),
      tipo: "averia_comunidad",
      tipo_averia: "acs",
      descripcion: "Sin agua caliente en todo el portal",
      direccion: "Fernando Maturana 22",
      piso: null,
      alcance: "general",
      nombre: "Presidente de la comunidad, Iñaki",
      telefono: "600000014",
      desde_cuando: "desde las siete de la tarde",
      resumen: "Avería general de agua caliente en Fernando Maturana 22. Llama el presidente. Fuera de horario de oficina.",
      duracion_s: 97,
      coste_eur: 0.1521,
      comunidad_id: com["Fernando Maturana 22"].id,
      estado: "pasado_al_programa",
      pasado_por: "Oficina",
      pasado_at: fecha(4, 8, 20),
    }),
    voz(5, {
      created_at: fecha(4, 9, 5),
      tipo: "averia_comunidad",
      tipo_averia: "calefaccion",
      descripcion: "Ruido fuerte en los radiadores",
      direccion: "Los Herrán 40",
      piso: "2º A",
      nombre: "Carmen Ruiz",
      telefono: "600000015",
      desde_cuando: "esta semana",
      resumen: "Ruidos en la instalación de calefacción en Los Herrán 40, 2º A. La comunidad no tiene contrato vigente.",
      duracion_s: 141,
      coste_eur: 0.2104,
      comunidad_id: com["Los Herrán 40"].id,
      estado: "revisar",
      motivo_revisar: "comunidad sin contrato vigente",
    }),
    voz(6, {
      created_at: fecha(4, 13, 30),
      tipo: "otro",
      descripcion: "Pide presupuesto para cambiar la caldera de un bajo comercial",
      direccion: "Avenida Gasteiz 50",
      piso: "bajo",
      nombre: "Peio Arrieta (Bar Aitzol)",
      telefono: "600000016",
      alcance: "desconocido",
      resumen: "Comercial: presupuesto para sustituir caldera en un bar. Le llamará ingeniería.",
      duracion_s: 84,
      coste_eur: 0.1502,
      comunidad_reconocida: false,
      comunidad_id: null,
      estado: "pasado_al_programa",
      pasado_por: "Guillermo",
      pasado_at: fecha(4, 14, 0),
    }),
    voz(7, {
      created_at: fecha(3, 7, 48),
      tipo: "silencio",
      descripcion: null,
      direccion: null,
      nombre: null,
      telefono: null,
      alcance: "desconocido",
      datos_completos: false,
      resumen: "Sin voz tras el saludo. Colgó a los 15 segundos.",
      duracion_s: 22,
      coste_eur: 0.0412,
      comunidad_reconocida: null,
      estado: "cerrado",
    }),
    chat(8, {
      created_at: fecha(3, 10, 15),
      tipo: "averia_comunidad",
      tipo_averia: "calefaccion",
      descripcion: "La calefacción no arranca por las mañanas",
      direccion: "Portal de Gamarra 1",
      piso: "5º C",
      alcance: "individual",
      nombre: "Rosa Mendizabal",
      telefono: "600000017",
      desde_cuando: "tres días",
      resumen: "Calefacción que no arranca a primera hora en Portal de Gamarra 1, 5º C. La comunidad tiene pagos pendientes.",
      comunidad_reconocida: true,
      comunidad_id: com["Portal de Gamarra 1"].id,
      estado: "revisar",
      motivo_revisar: "comunidad con pagos pendientes",
    }),
    voz(9, {
      created_at: fecha(2, 12, 2),
      tipo: "averia_particular",
      tipo_averia: "caldera",
      descripcion: "Pierde agua por debajo de la caldera",
      direccion: "Calle Beato Tomás de Zumárraga 31",
      piso: "6º izquierda",
      nombre: "Andoni Larrañaga",
      telefono: "600000018",
      marca: "Junkers",
      modelo: "",
      antiguedad: "12 años",
      contrato_mantenimiento: "si",
      resumen: "Particular con contrato de mantenimiento. Caldera Junkers de 12 años pierde agua. Urge visita, no es fuga grande.",
      duracion_s: 203,
      coste_eur: 0.2918,
      comunidad_reconocida: false,
      comunidad_id: null,
    }),
    voz(10, {
      created_at: fecha(2, 16, 44),
      tipo: "persona",
      descripcion: "Quería hablar con una persona, no ha querido dejar aviso",
      direccion: null,
      nombre: null,
      telefono: "600000019",
      alcance: "desconocido",
      datos_completos: false,
      resumen: "Pidió hablar con una persona fuera de horario y no quiso registrar el aviso.",
      duracion_s: 61,
      coste_eur: 0.1503,
      comunidad_reconocida: null,
      estado: "revisar",
      motivo_revisar: "quería persona, sin datos",
    }),
    voz(11, {
      created_at: fecha(1, 8, 31),
      tipo: "averia_comunidad",
      tipo_averia: "calefaccion",
      descripcion: "Sin calefacción, radiadores fríos",
      direccion: "Fernando Maturana 24",
      piso: "1º derecha",
      alcance: "individual",
      nombre: "Luis Fernández",
      telefono: "600000020",
      desde_cuando: "esta mañana",
      resumen: "Vecino de Fernando Maturana 24, 1º derecha, sin calefacción desde esta mañana.",
      duracion_s: 129,
      coste_eur: 0.1998,
      comunidad_id: com["Fernando Maturana 24"].id,
    }),
    voz(12, {
      created_at: fecha(1, 21, 10),
      tipo: "urgencia",
      urgente: true,
      descripcion: "Olor a gas en el rellano del segundo",
      direccion: "Pintor Vera Fajardo 6",
      piso: "2º",
      alcance: "general",
      nombre: "Vecino del 2º A",
      telefono: "600000021",
      datos_completos: false,
      resumen: "URGENCIA: olor a gas en Pintor Vera Fajardo 6. Transferida al número de guardia a los 20 s.",
      duracion_s: 48,
      coste_eur: 0.1511,
      comunidad_id: com["Pintor Vera Fajardo 6"].id,
      estado: "pasado_al_programa",
      pasado_por: "Guardia",
      pasado_at: fecha(1, 21, 12),
    }),
    chat(13, {
      created_at: fecha(0, 8, 5),
      tipo: "recibo",
      tipo_averia: "recibo_calefaccion",
      descripcion: "El recibo de calefacción se ha duplicado respecto al año pasado",
      direccion: "Los Herrán 40",
      piso: "4º B",
      nombre: "Nerea Agirre",
      telefono: "600000022",
      lectura_comprobada: "si",
      email: "nerea.agirre@example.com",
      resumen: "Recibo de calefacción duplicado. Ha comprobado la lectura y coincide. Escribirá a lecturas@fojansa.com.",
      comunidad_reconocida: true,
      comunidad_id: com["Los Herrán 40"].id,
    }),
    voz(14, {
      created_at: fecha(0, 9, 22),
      tipo: "averia_comunidad",
      tipo_averia: "acs",
      descripcion: "El agua caliente sale templada",
      direccion: "Portal de Gamarra 1",
      piso: "3º D",
      alcance: "individual",
      nombre: "Mikel Urrutia",
      telefono: "600000023",
      desde_cuando: "desde el fin de semana",
      resumen: "Agua caliente templada en Portal de Gamarra 1, 3º D. Individual. Comunidad con pagos pendientes: revisar antes de pasar.",
      duracion_s: 166,
      coste_eur: 0.2487,
      comunidad_id: com["Portal de Gamarra 1"].id,
      estado: "revisar",
      motivo_revisar: "comunidad con pagos pendientes",
    }),
  ];

  const ia = await sb.from("fojansa_avisos").insert(avisos).select("id");
  if (ia.error) throw ia.error;

  const partes = [
    {
      created_at: fecha(1, 18, 30),
      fecha_trabajo: fechaDia(1),
      canal: "telegram",
      operario_id: "tg-demo-1",
      operario_nombre: "Vasile Popescu",
      idioma_detectado: "ro",
      audio_duracion_s: 41,
      transcripcion_original: "Azi am montat 12 metri de țeavă de cupru la etajul 2, bloc Zabalgana, și am pus 3 radiatoare. Am lucrat 8 ore. Lipsesc două valve termostatice.",
      transcripcion_es: "Hoy he montado 12 metros de tubería de cobre en la planta 2 del edificio de Zabalgana y he puesto 3 radiadores. He trabajado 8 horas. Faltan dos válvulas termostáticas.",
      obra: "Zabalgana · bloque 3",
      partida: "Calefacción · distribución",
      trabajo_realizado: "Montaje de 12 m de tubería de cobre y 3 radiadores en planta 2",
      cantidad: 12,
      unidad: "m",
      horas: 8,
      materiales: "Tubería de cobre 22 mm, 3 radiadores",
      incidencias: "Faltan dos válvulas termostáticas",
      datos_completos: true,
      estado: "pendiente_revision",
      raw: { seed: "demo" },
    },
    {
      created_at: fecha(1, 18, 52),
      fecha_trabajo: fechaDia(1),
      canal: "telegram",
      operario_id: "tg-demo-2",
      operario_nombre: "João Carvalho",
      idioma_detectado: "pt",
      audio_duracion_s: 35,
      transcripcion_original: "Fiz a ligação da caldeira na sala de caldeiras do Hospital, bloco B, com o Vasile. Foram 6 horas. Falta o teste de pressão para amanhã.",
      transcripcion_es: "He hecho la conexión de la caldera en la sala de calderas del Hospital, bloque B, con Vasile. Han sido 6 horas. Falta la prueba de presión para mañana.",
      obra: "Hospital · sala de calderas",
      partida: "Sala de calderas · conexión",
      trabajo_realizado: "Conexión de caldera en sala de calderas, bloque B",
      cantidad: 1,
      unidad: "ud",
      horas: 6,
      materiales: null,
      incidencias: "Pendiente prueba de presión",
      datos_completos: true,
      estado: "validado",
      revisado_por: "Jefe de obra",
      revisado_at: fecha(0, 8, 10),
      raw: { seed: "demo" },
    },
    {
      created_at: fecha(1, 19, 5),
      fecha_trabajo: fechaDia(1),
      canal: "telegram",
      operario_id: "tg-demo-3",
      operario_nombre: "Iker Mendieta",
      idioma_detectado: "es",
      audio_duracion_s: 22,
      transcripcion_original: "Zabalgana bloque 3, he terminado de aislar los montantes del patio, unos treinta metros de coquilla.",
      transcripcion_es: "Zabalgana bloque 3, he terminado de aislar los montantes del patio, unos treinta metros de coquilla.",
      obra: "Zabalgana · bloque 3",
      partida: "Calefacción · aislamiento",
      trabajo_realizado: "Aislamiento de montantes del patio con coquilla",
      cantidad: 30,
      unidad: "m",
      horas: null,
      materiales: "Coquilla",
      incidencias: null,
      datos_completos: false,
      motivo_revisar: "no dice las horas",
      estado: "pendiente_revision",
      raw: { seed: "demo" },
    },
    {
      created_at: fecha(0, 13, 40),
      fecha_trabajo: fechaDia(0),
      canal: "telegram",
      operario_id: "tg-demo-4",
      operario_nombre: "Ahmed Benali",
      idioma_detectado: "ar",
      audio_duracion_s: 38,
      transcripcion_original: "اليوم ركبت أربعة مشعات في الطابق الثالث في مبنى زابالغانا وعملت سبع ساعات ونصف. كل شيء تمام.",
      transcripcion_es: "Hoy he instalado cuatro radiadores en la tercera planta del edificio de Zabalgana y he trabajado siete horas y media. Todo correcto.",
      obra: "Zabalgana · bloque 3",
      partida: "Calefacción · emisores",
      trabajo_realizado: "Instalación de 4 radiadores en planta 3",
      cantidad: 4,
      unidad: "ud",
      horas: 7.5,
      materiales: "4 radiadores de aluminio",
      incidencias: null,
      datos_completos: true,
      estado: "pendiente_revision",
      raw: { seed: "demo" },
    },
    {
      created_at: fecha(0, 14, 2),
      fecha_trabajo: fechaDia(0),
      canal: "telegram",
      operario_id: "tg-demo-1",
      operario_nombre: "Vasile Popescu",
      idioma_detectado: "ro",
      audio_duracion_s: 29,
      transcripcion_original: "La spital, sala cazanelor, am făcut proba de presiune cu João. A ținut. 4 ore. Am folosit garnituri noi la colector.",
      transcripcion_es: "En el Hospital, sala de calderas, hemos hecho la prueba de presión con João. Ha aguantado. 4 horas. Hemos usado juntas nuevas en el colector.",
      obra: "Hospital · sala de calderas",
      partida: "Sala de calderas · pruebas",
      trabajo_realizado: "Prueba de presión de la instalación (correcta)",
      cantidad: 1,
      unidad: "ud",
      horas: 4,
      materiales: "Juntas del colector",
      incidencias: null,
      datos_completos: true,
      estado: "corregido",
      revisado_por: "Jefe de obra",
      revisado_at: fecha(0, 15, 0),
      raw: { seed: "demo" },
    },
    {
      created_at: fecha(0, 14, 30),
      fecha_trabajo: fechaDia(0),
      canal: "telegram",
      operario_id: "tg-demo-2",
      operario_nombre: "João Carvalho",
      idioma_detectado: "pt",
      audio_duracion_s: 18,
      transcripcion_original: "Hoje estive doente, não fui à obra.",
      transcripcion_es: "Hoy he estado enfermo, no he ido a la obra.",
      obra: null,
      partida: null,
      trabajo_realizado: null,
      cantidad: null,
      unidad: null,
      horas: 0,
      materiales: null,
      incidencias: "Baja por enfermedad",
      datos_completos: false,
      motivo_revisar: "no es un parte de trabajo",
      estado: "descartado",
      revisado_por: "Jefe de obra",
      revisado_at: fecha(0, 15, 2),
      raw: { seed: "demo" },
    },
  ];
  const ip = await sb.from("fojansa_partes").insert(partes).select("id");
  if (ip.error) throw ip.error;

  console.log(`Sembrados: ${ia.data.length} avisos y ${ip.data.length} partes de demo. Los contactos se crean solos al abrir la bandeja.`);
}

(async () => {
  await borrar();
  if (!soloBorrar) await sembrar();
})().catch((e) => {
  console.error("Seed falló:", e.message ?? e);
  process.exit(1);
});
