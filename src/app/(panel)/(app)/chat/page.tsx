import { Titulo } from "@/components/ui";
import { ChatWhatsApp } from "@/components/ChatWhatsApp";
import { LlamadaNavegador } from "@/components/LlamadaNavegador";

export const metadata = { title: "Probar el asistente" };

/** Probar el asistente: por voz desde el navegador (Retell Web Call) y por chat estilo WhatsApp (spec §2.6). */
export default function PaginaChat() {
  return (
    <>
      <Titulo sub="El mismo cerebro que atiende el teléfono: pruébalo por voz desde el navegador o por escrito como si fuera WhatsApp. Lo que cierre, aparece en la bandeja.">
        Probar el asistente
      </Titulo>
      <div className="mx-auto max-w-2xl space-y-4">
        <LlamadaNavegador />
        <ChatWhatsApp />
      </div>
    </>
  );
}
