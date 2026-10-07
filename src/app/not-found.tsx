import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-5xl font-semibold text-fj-navy">404</p>
      <p className="text-fj-muted">Esta página no existe o el registro se ha borrado.</p>
      <Link href="/" className="text-sm font-medium text-fj-navy underline">
        Volver al inicio
      </Link>
    </main>
  );
}
