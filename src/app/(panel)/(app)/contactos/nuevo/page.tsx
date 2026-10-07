import Link from "next/link";
import { listarComunidades } from "@/lib/datos/comunidades";
import { Titulo } from "@/components/ui";
import { FormularioContacto } from "@/components/FormularioContacto";

export const metadata = { title: "Nuevo contacto" };

export default async function PaginaNuevoContacto() {
  const comunidades = await listarComunidades();
  return (
    <>
      <nav className="mb-3 text-sm text-fj-muted">
        <Link href="/contactos" className="hover:text-fj-navy hover:underline">
          Contactos
        </Link>{" "}
        / Nuevo
      </nav>
      <Titulo sub="Alta manual. Los contactos de las llamadas y chats se crean solos.">Nuevo contacto</Titulo>
      <div className="max-w-lg">
        <FormularioContacto contacto={null} comunidades={comunidades.map((c) => ({ id: c.id, texto: c.nombre ?? c.direccion }))} estadoDerivado={null} />
      </div>
    </>
  );
}
