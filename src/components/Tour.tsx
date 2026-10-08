"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { driver, type Driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { CLAVE_PASO_TOUR, CLAVE_TOUR_VISTO, EVENTO_TOUR, PASOS_TOUR, resolverPasos, type PasoTour } from "@/lib/tour";

/**
 * Tour de bienvenida (onboarding) estilo SaaS con driver.js.
 *
 * - Los pasos de una misma página se recorren con la secuencia nativa de la librería (Siguiente /
 *   Atrás); al llegar al borde de la página se navega a la siguiente ruta y se retoma allí.
 * - El paso en curso vive en sessionStorage para sobrevivir al cambio de ruta.
 * - Arranca solo la primera vez (`visto` false) y desde el menú del usuario (evento EVENTO_TOUR).
 * - «No volver a mostrar», «Saltar el tour» y «Terminar» llaman a `marcarVisto` (perfil de Clerk o
 *   localStorage). Mientras está activo, `<html data-tour="1">` pausa el refresco automático.
 */
export function Tour({ visto, cargado, marcarVisto }: { visto: boolean; cargado: boolean; marcarVisto: (v: boolean) => Promise<void> | void }) {
  const router = useRouter();
  const ruta = usePathname();
  const pasosRef = useRef<PasoTour[] | null>(null);
  const conductor = useRef<Driver | null>(null);
  const noMostrar = useRef(false);
  const arrancado = useRef(false);
  const [, setTick] = useState(0);

  const limpiar = useCallback(() => {
    const d = conductor.current;
    conductor.current = null;
    d?.destroy();
    sessionStorage.removeItem(CLAVE_PASO_TOUR);
    document.documentElement.removeAttribute("data-tour");
  }, []);

  const terminar = useCallback(
    async (completado: boolean) => {
      limpiar();
      if (completado || noMostrar.current) await marcarVisto(true);
      setTick((t) => t + 1);
    },
    [limpiar, marcarVisto],
  );

  /** Carga los pasos (necesita el id del aviso más reciente para los del detalle). */
  const prepararPasos = useCallback(async (): Promise<PasoTour[]> => {
    if (pasosRef.current) return pasosRef.current;
    let avisoId: string | null = null;
    try {
      const r = await fetch("/api/avisos?limite=1", { cache: "no-store" });
      const j = await r.json();
      avisoId = j.avisos?.[0]?.id ?? null;
    } catch {
      avisoId = null;
    }
    pasosRef.current = resolverPasos(PASOS_TOUR, avisoId);
    return pasosRef.current;
  }, []);

  /** El elemento VISIBLE con ese data-tour (la bandeja tiene versión móvil y escritorio; una está oculta). */
  const elementoVisible = (objetivo: string): HTMLElement | null =>
    [...document.querySelectorAll<HTMLElement>(`[data-tour="${objetivo}"]`)].find((e) => e.getClientRects().length > 0) ?? null;

  const esperarElemento = (objetivo: string, intentos = 50): Promise<HTMLElement | null> =>
    new Promise((resolver) => {
      const buscar = (n: number) => {
        const el = elementoVisible(objetivo);
        if (el || n <= 0) return resolver(el);
        setTimeout(() => buscar(n - 1), 100);
      };
      buscar(intentos);
    });

  /** Muestra el paso global `i`: navega si está en otra ruta, o arranca la secuencia de esta página. */
  const mostrarPaso = useCallback(
    async (lista: PasoTour[], i: number) => {
      const paso = lista[i];
      if (!paso) return terminar(true);
      sessionStorage.setItem(CLAVE_PASO_TOUR, String(i));
      document.documentElement.setAttribute("data-tour", "1");

      if (paso.ruta !== ruta) {
        conductor.current?.destroy();
        conductor.current = null;
        router.push(paso.ruta);
        return; // el efecto de cambio de ruta retoma el paso al llegar
      }

      const el = await esperarElemento(paso.objetivo);
      if (!el) return mostrarPaso(lista, i + 1); // no está en pantalla: saltar el paso

      // Bloque de pasos consecutivos de esta misma ruta.
      let ini = i;
      while (ini > 0 && lista[ini - 1].ruta === ruta) ini--;
      let fin = i;
      while (fin < lista.length - 1 && lista[fin + 1].ruta === ruta) fin++;
      const locales = lista
        .map((p, g) => ({ p, g, el: elementoVisible(p.objetivo) }))
        .slice(ini, fin + 1)
        .filter((x): x is { p: PasoTour; g: number; el: HTMLElement } => x.el !== null);
      const posicion = Math.max(
        0,
        locales.findIndex(({ g }) => g === i),
      );

      const pasosDriver: DriveStep[] = locales.map(({ p, g, el }) => ({
        element: el,
        popover: {
          title: p.titulo,
          description: `${p.texto}<div class="fj-tour-progreso">Paso ${g + 1} de ${lista.length}</div>`,
          side: p.lado ?? "bottom",
          align: "start",
          showButtons: g === 0 ? ["next", "close"] : ["previous", "next", "close"],
          nextBtnText: g === lista.length - 1 ? "Terminar" : "Siguiente",
          doneBtnText: g === lista.length - 1 ? "Terminar" : "Siguiente",
        },
      }));

      conductor.current?.destroy();
      const d = driver({
        animate: true,
        overlayOpacity: 0.55,
        stagePadding: 8,
        stageRadius: 10,
        allowClose: true,
        prevBtnText: "Atrás",
        nextBtnText: "Siguiente",
        doneBtnText: "Siguiente",
        popoverClass: "fj-tour",
        steps: pasosDriver,
        onHighlightStarted: (_el, _step, opts) => {
          const g = locales[opts.state.activeIndex ?? 0]?.g;
          if (g !== undefined) sessionStorage.setItem(CLAVE_PASO_TOUR, String(g));
          _el?.scrollIntoView?.({ block: "center", behavior: "instant" });
        },
        onNextClick: (_el, _step, opts) => {
          const k = opts.state.activeIndex ?? 0;
          const g = locales[k].g;
          if (g >= lista.length - 1) return terminar(true);
          if (k < locales.length - 1) d.moveNext();
          else mostrarPaso(lista, g + 1);
        },
        onPrevClick: (_el, _step, opts) => {
          const k = opts.state.activeIndex ?? 0;
          const g = locales[k].g;
          if (g <= 0) return;
          if (k > 0) d.movePrevious();
          else mostrarPaso(lista, g - 1);
        },
        onCloseClick: () => terminar(false),
        // Esc o clic fuera: driver no se cierra solo si definimos esto; cerramos nosotros.
        onDestroyStarted: () => terminar(false),
        onPopoverRender: (popover) => {
          const pie = document.createElement("div");
          pie.className = "fj-tour-pie";
          const etiqueta = document.createElement("label");
          const caja = document.createElement("input");
          caja.type = "checkbox";
          caja.checked = noMostrar.current;
          caja.addEventListener("change", () => {
            noMostrar.current = caja.checked;
          });
          etiqueta.append(caja, document.createTextNode(" No volver a mostrar"));
          const saltar = document.createElement("button");
          saltar.type = "button";
          saltar.textContent = "Saltar el tour";
          saltar.addEventListener("click", () => terminar(false));
          pie.append(etiqueta, saltar);
          popover.wrapper.appendChild(pie);
        },
      });
      conductor.current = d;
      d.drive(posicion);
    },
    [ruta, router, terminar],
  );

  const arrancar = useCallback(
    async (desde = 0) => {
      noMostrar.current = false;
      const lista = await prepararPasos();
      mostrarPaso(lista, desde);
    },
    [prepararPasos, mostrarPaso],
  );

  // Primera vez: arranca solo. Desde el menú: evento.
  useEffect(() => {
    if (!cargado) return;
    const alEvento = () => arrancar(0);
    window.addEventListener(EVENTO_TOUR, alEvento);
    let id: ReturnType<typeof setTimeout> | undefined;
    if (!visto && !arrancado.current && !sessionStorage.getItem(CLAVE_PASO_TOUR)) {
      arrancado.current = true;
      id = setTimeout(() => arrancar(0), 900); // que la página pinte antes de resaltar
    }
    return () => {
      if (id) clearTimeout(id);
      window.removeEventListener(EVENTO_TOUR, alEvento);
    };
  }, [cargado, visto, arrancar]);

  // Al cambiar de ruta con un paso pendiente, retomarlo.
  useEffect(() => {
    const guardado = sessionStorage.getItem(CLAVE_PASO_TOUR);
    if (guardado === null) return;
    const i = Number(guardado);
    (async () => {
      const lista = await prepararPasos();
      if (lista[i]?.ruta === ruta) mostrarPaso(lista, i);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruta]);

  // Al desmontar (p. ej. salir), limpiar sin marcar nada.
  useEffect(() => () => conductor.current?.destroy(), []);

  return null;
}

/** Variante sin Clerk (desarrollo): "visto" en localStorage. */
export function TourLocal() {
  const [visto, setVisto] = useState(true);
  const [cargado, setCargado] = useState(false);
  useEffect(() => {
    try {
      setVisto(localStorage.getItem(CLAVE_TOUR_VISTO) === "1");
    } catch {
      setVisto(true);
    }
    setCargado(true);
  }, []);
  return (
    <Tour
      visto={visto}
      cargado={cargado}
      marcarVisto={(v) => {
        try {
          localStorage.setItem(CLAVE_TOUR_VISTO, v ? "1" : "0");
        } catch {}
        setVisto(v);
      }}
    />
  );
}
