import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import { clerkActivo } from "@/lib/acceso";

/**
 * Clerk envuelve todo el panel. Si no hay claves (desarrollo local sin cuenta) no se monta el
 * proveedor: `acceso.ts` decide si se entra o no.
 */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!clerkActivo()) return <>{children}</>;
  return (
    <ClerkProvider
      localization={{
        ...esES,
        signIn: {
          ...esES.signIn,
          start: {
            ...esES.signIn?.start,
            title: "Entrar al panel",
            subtitle: "Usuario y contraseña de Instalaciones Fojansa",
            // Con usuario + contraseña en un solo paso Clerk usa las claves "Combined" (en es-ES vienen vacías).
            titleCombined: "Entrar al panel",
            subtitleCombined: "Usuario y contraseña de Instalaciones Fojansa",
          },
        },
      }}
      appearance={{
        variables: { colorPrimary: "#002e62", borderRadius: "0.6rem", fontFamily: "var(--font-inter)" },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
