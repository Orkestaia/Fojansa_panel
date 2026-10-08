import Link from "next/link";
import { supabaseAdmin, TABLAS } from "@/lib/supabase";
import { Tarjeta, Titulo } from "@/components/ui";
import { BotonTour } from "@/components/BotonTour";

export const metadata = { title: "Guía de usuario" };
export const dynamic = "force-dynamic";

/** Las dos llamadas reales de prueba (7-oct-2026) para el ejemplo con audio. */
async function llamadasDeEjemplo() {
  const { data } = await supabaseAdmin()
    .from(TABLAS.avisos)
    .select("id, call_id, url_grabacion, transcripcion, duracion_s")
    .in("call_id", ["call_644b016e889c3437a1f1e794768", "call_6326b094734c734086e1a47132e"]);
  const filas = (data ?? []) as Array<{ id: string; call_id: string; url_grabacion: string | null; transcripcion: string | null; duracion_s: number | null }>;
  return {
    averia: filas.find((f) => f.call_id === "call_644b016e889c3437a1f1e794768") ?? null,
    urgencia: filas.find((f) => f.call_id === "call_6326b094734c734086e1a47132e") ?? null,
  };
}

function Transcripcion({ texto }: { texto: string }) {
  const lineas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(Agent|User):\s*(.*)$/);
      return m ? { quien: m[1] === "Agent" ? "Asistente" : "Vecino", dice: m[2] } : { quien: "", dice: l };
    });
  return (
    <div className="max-h-96 space-y-1.5 overflow-auto rounded-lg border border-fj-border bg-fj-surface-2 px-4 py-3 text-sm leading-relaxed">
      {lineas.map((l, i) => (
        <p key={i}>
          {l.quien && <strong className="text-fj-navy">{l.quien}: </strong>}
          {l.dice}
        </p>
      ))}
    </div>
  );
}

/**
 * Guía de usuario dentro del panel (desde el menú del usuario). Qué hace el asistente de voz, los
 * guiones, una llamada real con audio, y cómo funcionan el chat y los partes. Lo de "dónde pulsar"
 * lo cuenta el tour.
 */
export default async function PaginaGuia() {
  const ej = await llamadasDeEjemplo();
  return (
    <>
      <Titulo sub="Cómo funciona el asistente que coge el teléfono, el chat y los partes por audio. Lo de dónde pulsar te lo enseña el tour." acciones={<BotonTour />}>
        Guía de usuario
      </Titulo>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Apartados" className="lg:sticky lg:top-20 lg:self-start">
          <ol className="space-y-1 text-sm">
            {[
              ["que-es", "Qué es"],
              ["voz", "El asistente de voz"],
              ["llamada", "Una llamada real"],
              ["avisos", "Avisos y estados"],
              ["contactos", "Contactos y comunidades"],
              ["partes", "Partes por audio"],
              ["chat", "El chat"],
              ["gastos", "Gastos"],
              ["faq", "Preguntas frecuentes"],
            ].map(([id, t]) => (
              <li key={id}>
                <a href={`#${id}`} className="block rounded-lg px-3 py-1.5 text-fj-muted hover:bg-fj-navy-soft hover:text-fj-navy">
                  {t}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-6">
          <Tarjeta className="p-6" id="que-es">
            <h2 className="text-lg font-semibold text-fj-navy">Qué es</h2>
            <p className="mt-2 text-fj-text">
              Un asistente atiende las llamadas de avisos (averías de comunidad, averías de particulares con caldera propia, recibos y otras
              consultas), recoge los datos como lo hace oficina y los deja en este panel. El mismo asistente atiende por chat. Los operarios
              pueden mandar una nota de voz al terminar el día, en su idioma, y queda un parte en español.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-fj-surface-2 p-4">
                <h3 className="text-sm font-semibold text-fj-text">Lo que hace el asistente</h3>
                <p className="mt-1 text-sm text-fj-muted">
                  Pregunta qué pasa, confirma dirección y teléfono repitiéndolos, apunta nombre, desde cuándo y, si es una caldera propia, marca,
                  modelo, antigüedad y contrato. Al colgar, el aviso aparece aquí en menos de 15 segundos con la grabación.
                </p>
              </div>
              <div className="rounded-lg bg-fj-surface-2 p-4">
                <h3 className="text-sm font-semibold text-fj-text">Lo que hace oficina</h3>
                <p className="mt-1 text-sm text-fj-muted">
                  Mira la bandeja, abre el aviso, escucha si hace falta, copia los datos a Go!Manage con un botón y marca «Pasado al programa».
                  El panel no decide: señala, filtra y deja la última palabra a oficina.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border-l-4 border-fj-cyan bg-fj-cyan-soft px-4 py-3 text-sm text-fj-text">
              <strong>Urgencias de gas, fugas o humo:</strong> el asistente no hace preguntas. Pasa la llamada a una persona (el número de guardia) y, si nadie contesta en 20 segundos,
              recoge teléfono y dirección y avisa a oficina de inmediato.
            </div>
          </Tarjeta>

          <Tarjeta className="p-6" id="voz">
            <h2 className="text-lg font-semibold text-fj-navy">El asistente de voz</h2>
            <p className="mt-2 text-sm text-fj-text">
              Saluda así: <em>«Instalaciones Fojansa, buenos días. Le atiende el asistente virtual. La llamada se graba para gestionar su aviso. Si en cualquier momento prefiere hablar con una persona, dígamelo. ¿En qué puedo ayudarle?»</em>. Con lo primero que dice la persona decide el camino:
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs font-medium uppercase tracking-wide text-fj-faint">
                  <tr>
                    <th className="py-2 pr-3">Si la persona dice…</th>
                    <th className="py-2 pr-3">El asistente…</th>
                    <th className="py-2">Sale como</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fj-border align-top">
                  <tr><td className="py-2 pr-3">Que no funciona la calefacción o el agua caliente de su comunidad</td><td className="py-2 pr-3 text-fj-muted">Pregunta si es calefacción o agua caliente, si le pasa solo a él o a toda la comunidad, desde cuándo, y pide dirección con piso y mano, teléfono y nombre. Repite dirección y teléfono para confirmarlos.</td><td className="py-2">Avería comunidad</td></tr>
                  <tr><td className="py-2 pr-3">Que tiene una caldera propia que falla</td><td className="py-2 pr-3 text-fj-muted">Pregunta qué le pasa, marca y modelo, años y si tiene contrato de mantenimiento; luego dirección, teléfono y nombre.</td><td className="py-2">Avería particular</td></tr>
                  <tr><td className="py-2 pr-3">Que un recibo le parece excesivo</td><td className="py-2 pr-3 text-fj-muted">Pregunta comunidad y piso, si es agua caliente o calefacción y si ha comprobado la lectura. Le dicta lecturas@fojansa.com.</td><td className="py-2">Recibo</td></tr>
                  <tr><td className="py-2 pr-3">Presupuestos, obras, proveedores</td><td className="py-2 pr-3 text-fj-muted">Apunta nombre, teléfono y una frase. «Le llamará ingeniería».</td><td className="py-2">Otro</td></tr>
                  <tr><td className="py-2 pr-3">Olor a gas, fuga, humo</td><td className="py-2 pr-3 text-fj-muted">Sin preguntas: pasa con una persona.</td><td className="py-2"><span className="rounded-full bg-fj-danger px-2 py-0.5 text-xs font-semibold text-white">Urgente</span></td></tr>
                  <tr><td className="py-2 pr-3">Que quiere hablar con una persona</td><td className="py-2 pr-3 text-fj-muted">En horario la pasa; fuera de horario ofrece registrar el aviso para que le llamen a primera hora.</td><td className="py-2">Quería persona</td></tr>
                  <tr><td className="py-2 pr-3">Nada (silencio o cuelga)</td><td className="py-2 pr-3 text-fj-muted">Insiste dos veces y se despide a los 15 segundos.</td><td className="py-2">Silencio · Revisar</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-fj-muted">
              Nunca promete día, hora ni precio. Si la dirección no está en la lista de comunidades, no se lo dice al vecino: registra el aviso igualmente y lo marca para revisar.
            </p>
          </Tarjeta>

          <Tarjeta className="p-6" id="llamada">
            <h2 className="text-lg font-semibold text-fj-navy">Una llamada real de prueba</h2>
            <p className="mt-2 text-sm text-fj-text">
              Llamada de prueba del 7 de octubre con el guion de «avería de comunidad». Fíjate en cómo repite la dirección y el teléfono y en cómo pide que deletreen la calle cuando no la entiende.
            </p>
            {ej.averia?.url_grabacion ? (
              <audio controls preload="none" src={ej.averia.url_grabacion} className="mt-3 w-full">
                Tu navegador no reproduce audio.
              </audio>
            ) : (
              <p className="mt-3 text-sm text-fj-faint">La grabación de ejemplo no está disponible.</p>
            )}
            {ej.averia && (
              <p className="mt-1 text-xs text-fj-muted">
                {ej.averia.duracion_s ? `${Math.floor(ej.averia.duracion_s / 60)} min ${ej.averia.duracion_s % 60} s · ` : ""}
                <Link href={`/avisos/${ej.averia.id}`} className="text-fj-navy underline-offset-2 hover:underline">
                  ver este aviso en la bandeja
                </Link>
              </p>
            )}
            {ej.averia?.transcripcion && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-fj-navy">Transcripción</summary>
                <div className="mt-2">
                  <Transcripcion texto={ej.averia.transcripcion} />
                </div>
              </details>
            )}
            <div className="mt-4 rounded-lg border-l-4 border-fj-warn bg-fj-warn-soft px-4 py-3 text-sm text-fj-text">
              <strong>Qué pasó con esta llamada:</strong> la calle no estaba en la lista de comunidades de prueba, así que el aviso entró con todos los datos pero marcado «Revisar: dirección no reconocida». Con vuestra lista real cargada, estas direcciones se reconocen solas.
            </div>
            {ej.urgencia?.url_grabacion && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-fj-text">Y una urgencia de gas (52 s)</h3>
                <p className="mt-1 text-sm text-fj-muted">Sin preguntas: pasa la llamada a una persona.</p>
                <audio controls preload="none" src={ej.urgencia.url_grabacion} className="mt-2 w-full">
                  Tu navegador no reproduce audio.
                </audio>
              </div>
            )}
          </Tarjeta>

          <Tarjeta className="p-6" id="avisos">
            <h2 className="text-lg font-semibold text-fj-navy">Avisos y estados</h2>
            <ul className="mt-2 space-y-2 text-sm text-fj-text">
              <li><strong>Datos completos:</strong> ✔ cuando el asistente confirmó dirección, teléfono y nombre. Si no, «Revisar» con el motivo (teléfono no válido, dirección no reconocida, comunidad con pagos pendientes…).</li>
              <li><strong>Nuevo</strong> acaba de entrar · <strong>Revisar</strong> necesita que alguien lo mire · <strong>Pasado al programa</strong> ya está en Go!Manage (queda quién y cuándo) · <strong>Cerrado</strong> no requería nada más.</li>
              <li><strong>Derivado a:</strong> si el asistente pasó la llamada a una persona (guardia, oficina), a quién. Se puede anotar a mano en el detalle.</li>
              <li><strong>Colores:</strong> la franja de la izquierda es roja en urgencias, azul en averías, cian en recibos y gris en el resto.</li>
              <li><strong>Buscar:</strong> entiende las calles en euskera aunque se escriban a oído (Goicoechea encuentra Goikoetxea). El icono de chincheta abre la dirección en Google Maps.</li>
              <li><strong>Copiar para Go!Manage:</strong> copia dirección, piso, nombre, teléfono, tipo y descripción en el orden en que se teclean en el programa.</li>
            </ul>
          </Tarjeta>

          <Tarjeta className="p-6" id="contactos">
            <h2 className="text-lg font-semibold text-fj-navy">Contactos y comunidades</h2>
            <p className="mt-2 text-sm text-fj-text">
              Los contactos se crean solos: cada aviso con teléfono busca si ese número ya existe y, si no, lo crea con nombre, dirección y tipo. Su <strong>estado</strong> sale de la lista de comunidades: pagos pendientes, sin contrato o activo. En la ficha se puede corregir cualquier dato, enlazarlo a una comunidad y apuntar notas.
            </p>
            <p className="mt-2 text-sm text-fj-text">
              La <strong>lista de comunidades</strong> es la que usa el asistente para reconocer direcciones. Se carga con «Importar CSV» desde la exportación de Go!Manage (columnas direccion, nombre, administrador, contrato_vigente, pagos_al_dia; valen con tildes y mayúsculas, y sí/no). Las nuevas se crean y las existentes se actualizan por dirección; nada se borra. Cuanto más completa esté, menos avisos saldrán como «dirección no reconocida».
            </p>
          </Tarjeta>

          <Tarjeta className="p-6" id="partes">
            <h2 className="text-lg font-semibold text-fj-navy">Partes por audio</h2>
            <p className="mt-2 text-sm text-fj-text">
              Los operarios mandan una nota de voz al terminar el día, en su idioma, a un bot de Telegram (en la prueba; en producción puede ser WhatsApp). Se transcribe, se traduce al español y se sacan los datos: obra, partida, qué se ha hecho, cuánto, horas, materiales e incidencias. El operario recibe una confirmación en su idioma; si falta algo, se lo pide.
            </p>
            <p className="mt-2 text-sm text-fj-text">
              El jefe de obra revisa cada mañana: <strong>Validar</strong> si está bien, <strong>Corregir</strong> para ajustar horas, cantidades u obra, o <strong>Descartar</strong> si no es un parte. Queda apuntado quién lo revisó y cuándo. El resumen por obra suma horas y unidades de los partes no descartados. En la prueba el audio original no se guarda, solo la transcripción.
            </p>
          </Tarjeta>

          <Tarjeta className="p-6" id="chat">
            <h2 className="text-lg font-semibold text-fj-navy">El chat</h2>
            <p className="mt-2 text-sm text-fj-text">
              En «Probar el asistente» está el mismo cerebro que atiende el teléfono, por escrito y con aspecto de WhatsApp. Escribe como lo haría un vecino («no tengo calefacción en Fernando Maturana 24, tercero izquierda»), contesta a lo que pregunta y, cuando cierre el aviso, lo verás en la bandeja con el icono de chat. Prueba también el guion de particular, el de recibo y uno de «olor a gas».
            </p>
          </Tarjeta>

          <Tarjeta className="p-6" id="gastos">
            <h2 className="text-lg font-semibold text-fj-navy">Gastos</h2>
            <p className="mt-2 text-sm text-fj-text">
              Cada llamada de voz tiene su coste real desglosado (motor de voz, voz sintética, modelo de lenguaje, telefonía). Los importes vienen en dólares y se muestran tal cual en euros. Las respuestas del chat tienen un coste de milésimas de euro; en la prueba es una estimación. Una llamada de 2 o 3 minutos cuesta del orden de 20 a 30 céntimos.
            </p>
          </Tarjeta>

          <Tarjeta className="p-6" id="faq">
            <h2 className="text-lg font-semibold text-fj-navy">Preguntas frecuentes</h2>
            <dl className="mt-2 space-y-3 text-sm">
              <div><dt className="font-semibold text-fj-text">¿El asistente da de alta el aviso en Go!Manage?</dt><dd className="text-fj-muted">En la prueba no: oficina lo copia con el botón y lo pega. Darlo de alta directamente es una fase posterior que depende de probar su portal web.</dd></div>
              <div><dt className="font-semibold text-fj-text">¿Y si no entiende una calle?</dt><dd className="text-fj-muted">Pide que la deletreen y la repite hasta que la persona confirma. Si no coincide con la lista, el aviso entra marcado para revisar. Nunca se pierde.</dd></div>
              <div><dt className="font-semibold text-fj-text">¿Y fuera de horario?</dt><dd className="text-fj-muted">Registra el aviso igual y dice que le llamarán. Nunca promete hora ni día. Las urgencias van al número de guardia.</dd></div>
              <div><dt className="font-semibold text-fj-text">¿Atiende en euskera?</dt><dd className="text-fj-muted">En esta versión no. Entiende y escribe bien calles y apellidos en euskera, pero la conversación es en castellano.</dd></div>
              <div><dt className="font-semibold text-fj-text">¿Se guardan las llamadas?</dt><dd className="text-fj-muted">Sí, la grabación y la transcripción. El asistente lo avisa al descolgar. Cuánto tiempo se conservan lo decide Fojansa.</dd></div>
              <div><dt className="font-semibold text-fj-text">¿Qué necesitáis de nosotros?</dt><dd className="text-fj-muted">La lista de comunidades exportada de Go!Manage, el número de guardia para urgencias y el canal al que queréis los avisos de oficina. Y probar los tres guiones con vuestras palabras.</dd></div>
            </dl>
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
