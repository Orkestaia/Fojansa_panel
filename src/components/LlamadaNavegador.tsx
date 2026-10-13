"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RetellWebClient } from "retell-client-js-sdk";
import { claseBotonPeligro, claseBotonPrimario } from "./ui";

type Estado = "inactiva" | "conectando" | "en_llamada" | "terminada" | "error";

/**
 * «Llamar al asistente» desde el navegador (Web Call de Retell). El servidor crea la llamada
 * (`POST /api/voz`) y devuelve un token de un solo uso; aquí se conecta el micrófono con el agente.
 * Es la misma voz, el mismo guion y el mismo aviso en la bandeja que una llamada de teléfono.
 */
export function LlamadaNavegador() {
  const [estado, setEstado] = useState<Estado>("inactiva");
  const [error, setError] = useState<string | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [callId, setCallId] = useState<string | null>(null);
  const cliente = useRef<RetellWebClient | null>(null);
  const cronometro = useRef<ReturnType<typeof setInterval> | null>(null);

  function pararCronometro() {
    if (cronometro.current) clearInterval(cronometro.current);
    cronometro.current = null;
  }

  useEffect(
    () => () => {
      pararCronometro();
      cliente.current?.stopCall();
    },
    [],
  );

  async function llamar() {
    setError(null);
    setSegundos(0);
    setEstado("conectando");
    try {
      const r = await fetch("/api/voz", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? `Error ${r.status}`);
      setCallId(j.call_id ?? null);

      // El SDK solo existe en el navegador: se carga al pulsar.
      const { RetellWebClient } = await import("retell-client-js-sdk");
      const c = new RetellWebClient();
      cliente.current = c;
      c.on("call_started", () => {
        setEstado("en_llamada");
        pararCronometro();
        cronometro.current = setInterval(() => setSegundos((s) => s + 1), 1000);
      });
      c.on("call_ended", () => {
        pararCronometro();
        setEstado("terminada");
      });
      c.on("error", (e: unknown) => {
        pararCronometro();
        setError(typeof e === "string" ? e : "Se ha cortado la llamada");
        setEstado("error");
        c.stopCall();
      });
      await c.startCall({
        accessToken: j.access_token,
        callId: j.call_id,
        transport: j.transport ?? "gateway",
        iceServers: j.ice_servers ?? [],
      });
    } catch (e) {
      pararCronometro();
      const msg = e instanceof Error ? e.message : "No se ha podido iniciar la llamada";
      setError(/permission|denied|NotAllowed/i.test(msg) ? "El navegador no ha dado permiso para usar el micrófono." : msg);
      setEstado("error");
    }
  }

  function colgar() {
    cliente.current?.stopCall();
    pararCronometro();
    setEstado("terminada");
  }

  const mm = Math.floor(segundos / 60);
  const ss = (segundos % 60).toString().padStart(2, "0");

  return (
    <div className="rounded-2xl border border-fj-border bg-fj-surface p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fj-navy-soft text-fj-navy" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-fj-text">Probar por voz, sin teléfono</h2>
          <p className="mt-1 text-sm text-fj-muted">
            Habla con el mismo asistente que coge el teléfono, desde el micrófono de tu ordenador. Al colgar, el aviso aparece en la bandeja como una llamada más.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3" aria-live="polite">
        {estado === "inactiva" || estado === "terminada" || estado === "error" ? (
          <button type="button" onClick={llamar} className={claseBotonPrimario} data-tour="voz-boton">
            {estado === "inactiva" ? "Llamar al asistente" : "Llamar otra vez"}
          </button>
        ) : (
          <button type="button" onClick={colgar} className={claseBotonPeligro} disabled={estado === "conectando"}>
            Colgar
          </button>
        )}
        {estado === "conectando" && <span className="text-sm text-fj-muted">Conectando… acepta el permiso del micrófono si te lo pide.</span>}
        {estado === "en_llamada" && (
          <span className="inline-flex items-center gap-2 text-sm text-fj-text">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-fj-danger" aria-hidden />
            En llamada · <span className="tabular">{mm}:{ss}</span>
          </span>
        )}
        {estado === "terminada" && (
          <span className="text-sm text-fj-ok">
            Llamada terminada ({mm}:{ss}).{" "}
            <Link href="/avisos" className="font-medium text-fj-navy underline-offset-2 hover:underline">
              Ver la bandeja
            </Link>{" "}
            (tarda unos segundos en aparecer).
          </span>
        )}
        {estado === "error" && error && <span className="text-sm text-fj-danger">{error}</span>}
      </div>
      {callId && estado !== "inactiva" && <p className="mt-2 font-mono text-[11px] text-fj-faint">llamada {callId}</p>}
      <p className="mt-3 text-xs text-fj-faint">Usa Chrome, Edge o Safari actualizados y auriculares si puedes. La llamada se graba, igual que las de teléfono.</p>
    </div>
  );
}
