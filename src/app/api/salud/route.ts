export const dynamic = "force-dynamic";

/** Comprobación de vida para Docker / monitorización. Sin datos. */
export function GET() {
  return Response.json({ ok: true, hora: new Date().toISOString() });
}
