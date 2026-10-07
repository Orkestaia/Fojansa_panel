import { exigirUsuario } from "@/lib/acceso";
import { leerCuerpo, respuestaError } from "@/lib/api";
import { crearContacto, listarContactos } from "@/lib/datos/contactos";
import { EsquemaContacto } from "@/lib/esquemas";
import { ESTADOS_CONTACTO, type EstadoContacto } from "@/lib/tipos";

export const dynamic = "force-dynamic";

/** GET /api/contactos?q=&estado= */
export async function GET(req: Request) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  try {
    const p = new URL(req.url).searchParams;
    const estado = p.get("estado");
    const contactos = await listarContactos(
      p.get("q") ?? undefined,
      (ESTADOS_CONTACTO as readonly string[]).includes(estado ?? "") ? (estado as EstadoContacto) : undefined,
    );
    return Response.json({ contactos });
  } catch (e) {
    return respuestaError(e);
  }
}

/** POST /api/contactos: alta manual. */
export async function POST(req: Request) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  const cuerpo = await leerCuerpo(req, EsquemaContacto);
  if ("error" in cuerpo) return cuerpo.error;
  if (!cuerpo.datos.nombre && !cuerpo.datos.telefono) {
    return Response.json({ error: "Hace falta al menos nombre o teléfono" }, { status: 400 });
  }
  try {
    return Response.json({ contacto: await crearContacto(cuerpo.datos) }, { status: 201 });
  } catch (e) {
    return respuestaError(e);
  }
}
