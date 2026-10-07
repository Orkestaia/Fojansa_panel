import { exigirUsuario } from "@/lib/acceso";
import { leerCuerpo, respuestaError } from "@/lib/api";
import { crearComunidad, listarComunidades } from "@/lib/datos/comunidades";
import { EsquemaComunidad } from "@/lib/esquemas";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  try {
    return Response.json({ comunidades: await listarComunidades(new URL(req.url).searchParams.get("q") ?? undefined) });
  } catch (e) {
    return respuestaError(e);
  }
}

export async function POST(req: Request) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  const cuerpo = await leerCuerpo(req, EsquemaComunidad.required({ direccion: true }));
  if ("error" in cuerpo) return cuerpo.error;
  try {
    return Response.json({ comunidad: await crearComunidad(cuerpo.datos) }, { status: 201 });
  } catch (e) {
    return respuestaError(e);
  }
}
