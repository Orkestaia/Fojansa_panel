import Image from "next/image";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { clerkActivo } from "@/lib/acceso";

export const metadata = { title: "Acceso" };

export default function PaginaAcceso() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <Image src="/fojansa-logo.png" alt="Instalaciones Fojansa" width={180} height={64} priority />
      {clerkActivo() ? (
        <SignIn />
      ) : (
        <div className="max-w-sm rounded-xl border border-fj-border bg-fj-surface p-6 text-center text-sm text-fj-muted">
          <p>Clerk no está configurado en este entorno.</p>
          <p className="mt-2">
            En desarrollo el panel abre sin login:{" "}
            <Link href="/" className="font-medium text-fj-navy underline">
              entrar
            </Link>
            .
          </p>
        </div>
      )}
      <p className="text-xs text-fj-faint">Panel de avisos · con tecnología de Orkesta</p>
    </main>
  );
}
