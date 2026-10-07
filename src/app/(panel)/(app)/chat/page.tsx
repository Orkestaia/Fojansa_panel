import { Titulo } from "@/components/ui";
import { ChatWhatsApp } from "@/components/ChatWhatsApp";

export const metadata = { title: "Probar el asistente" };

/** Chat que simula WhatsApp (spec §2.6). El session_id se genera en el navegador por carga. */
export default function PaginaChat() {
  return (
    <>
      <Titulo sub="El mismo cerebro que atiende el teléfono, por escrito. En producción será WhatsApp. Cuando cierra un aviso, aparece en la bandeja.">
        Probar el asistente
      </Titulo>
      <ChatWhatsApp />
    </>
  );
}
