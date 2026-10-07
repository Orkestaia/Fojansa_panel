"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Polling (spec §2.2: "realtime o polling cada 10 s"): vuelve a pedir la página al servidor cada
 * N segundos mientras la pestaña está visible. Los componentes de servidor se re-renderizan con
 * los datos nuevos sin perder el estado del cliente (filtros, scroll).
 */
export function Refresco({ segundos = 10 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, segundos * 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, segundos]);
  return null;
}
