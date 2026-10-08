"use client";

import { useRouter } from "next/navigation";
import { EVENTO_TOUR } from "@/lib/tour";
import { claseBotonPrimario } from "./ui";

/** Lanza el tour desde cualquier página (el tour empieza en Inicio y navega solo). */
export function BotonTour() {
  const router = useRouter();
  return (
    <button
      type="button"
      className={claseBotonPrimario}
      onClick={() => {
        router.push("/");
        setTimeout(() => window.dispatchEvent(new CustomEvent(EVENTO_TOUR)), 600);
      }}
    >
      Ver el tour guiado
    </button>
  );
}
