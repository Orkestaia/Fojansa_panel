import { exigirUsuario } from "@/lib/acceso";
import { respuestaError } from "@/lib/api";
import { leerComunidadesCsv } from "@/lib/csv";
import { importarComunidades } from "@/lib/datos/comunidades";

export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024;

/** POST /api/comunidades/importar (multipart, campo `archivo`, o text/csv en el cuerpo). */
export async function POST(req: Request) {
  const acceso = await exigirUsuario();
  if ("error" in acceso) return acceso.error;
  try {
    let texto: string;
    const tipo = req.headers.get("content-type") ?? "";
    if (tipo.includes("multipart/form-data")) {
      const fd = await req.formData();
      const archivo = fd.get("archivo");
      if (!(archivo instanceof File)) return Response.json({ error: "Falta el archivo" }, { status: 400 });
      if (archivo.size > MAX_BYTES) return Response.json({ error: "Archivo demasiado grande (máx. 2 MB)" }, { status: 413 });
      texto = await archivo.text();
    } else {
      texto = await req.text();
      if (texto.length > MAX_BYTES) return Response.json({ error: "Archivo demasiado grande (máx. 2 MB)" }, { status: 413 });
    }
    const lectura = leerComunidadesCsv(texto);
    if (lectura.comunidades.length === 0) {
      return Response.json(
        { error: lectura.descartadas[0]?.motivo ?? "El CSV no tiene filas válidas", ...lectura, creadas: 0, actualizadas: 0 },
        { status: 400 },
      );
    }
    const r = await importarComunidades(lectura.comunidades);
    return Response.json({ ...r, descartadas: lectura.descartadas, columnas: lectura.columnas });
  } catch (e) {
    return respuestaError(e);
  }
}
