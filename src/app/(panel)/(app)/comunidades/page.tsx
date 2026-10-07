import { listarComunidades } from "@/lib/datos/comunidades";
import { Titulo } from "@/components/ui";
import { BuscadorSimple } from "@/components/BuscadorSimple";
import { TablaComunidades } from "@/components/TablaComunidades";
import { ImportarCsv } from "@/components/ImportarCsv";

export const metadata = { title: "Comunidades" };

/** Comunidades (spec §2.4): lista editable inline + importación CSV de Go!Manage. */
export default async function PaginaComunidades({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const comunidades = await listarComunidades(sp.q);
  return (
    <>
      <Titulo
        sub="La lista con la que el asistente reconoce las direcciones. Contrato y pagos marcan el estado del contacto."
        acciones={<ImportarCsv />}
      >
        Comunidades
      </Titulo>
      <BuscadorSimple placeholder="Buscar dirección, nombre o administrador… (vale Goicoechea por Goikoetxea)" />
      <div className="mt-4">
        <TablaComunidades comunidades={comunidades} />
      </div>
    </>
  );
}
