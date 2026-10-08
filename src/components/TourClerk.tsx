"use client";

import { useUser } from "@clerk/nextjs";
import { Tour } from "./Tour";

/**
 * Variante con Clerk: "ya vi el tour" se guarda en `unsafeMetadata.tourVisto` del usuario, así
 * vale en cualquier dispositivo y es por persona. Solo se monta dentro de ClerkProvider.
 */
export function TourClerk() {
  const { user, isLoaded } = useUser();
  const visto = Boolean(user?.unsafeMetadata?.tourVisto);
  return (
    <Tour
      visto={visto}
      cargado={isLoaded && Boolean(user)}
      marcarVisto={async (v) => {
        if (!user) return;
        try {
          await user.update({ unsafeMetadata: { ...user.unsafeMetadata, tourVisto: v } });
        } catch (e) {
          console.error("[tour] no se pudo guardar en el perfil:", e);
        }
      }}
    />
  );
}
