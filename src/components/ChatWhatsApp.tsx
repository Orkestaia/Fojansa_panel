"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Mensaje {
  id: number;
  de: "yo" | "bot";
  texto: string;
  hora: string;
}

function horaAhora() {
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function nuevoSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `panel-${crypto.randomUUID()}`;
  return `panel-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Interfaz estilo WhatsApp (spec §2.6): burbujas verdes (mías) y blancas (asistente), cabecera
 * "Instalaciones Fojansa · asistente". Un session_id nuevo por carga; "Nueva conversación" lo renueva.
 * Sin persistencia: el historial vive en n8n.
 */
export function ChatWhatsApp() {
  const [sessionId, setSessionId] = useState<string>("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [avisosRegistrados, setAvisosRegistrados] = useState(0);
  const fin = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSessionId(nuevoSessionId());
  }, []);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, enviando]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  function reiniciar() {
    setSessionId(nuevoSessionId());
    setMensajes([]);
    setError(null);
    setTexto("");
    campo.current?.focus();
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || enviando || !sessionId) return;
    setError(null);
    setTexto("");
    setMensajes((m) => [...m, { id: Date.now(), de: "yo", texto: t, hora: horaAhora() }]);
    setEnviando(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, texto: t }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? `Error ${r.status}`);
      setMensajes((m) => [...m, { id: Date.now() + 1, de: "bot", texto: j.respuesta, hora: horaAhora() }]);
      if (j.aviso_registrado) {
        setAvisosRegistrados((n) => n + 1);
        setToast("Aviso registrado · ya está en la bandeja");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido enviar");
    } finally {
      setEnviando(false);
      campo.current?.focus();
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      <div className="relative flex h-[min(72dvh,760px)] flex-col overflow-hidden rounded-2xl border border-fj-border shadow-sm">
        <header className="flex items-center gap-3 bg-wa-header px-4 py-3 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg" aria-hidden>
            💧
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">Instalaciones Fojansa · asistente</p>
            <p className="text-xs text-white/80">{enviando ? "escribiendo…" : "en línea"}</p>
          </div>
          <button type="button" onClick={reiniciar} className="rounded-lg px-2 py-1 text-xs text-white/90 hover:bg-white/10">
            Nueva conversación
          </button>
        </header>

        <div className="wa-fondo flex-1 overflow-y-auto px-4 py-4" role="log" aria-live="polite">
          <p className="mx-auto mb-4 w-fit rounded-lg bg-[#fff5c4] px-3 py-1.5 text-center text-xs text-[#5a4a00] shadow-sm">
            Demo. Escribe como lo haría un vecino: &quot;no tengo calefacción en Fernando Maturana 24, tercero izquierda&quot;.
          </p>
          <ul className="flex flex-col gap-1.5">
            {mensajes.map((m) => (
              <li key={m.id} className={`flex ${m.de === "yo" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`relative max-w-[80%] rounded-lg px-3 py-1.5 text-[15px] leading-snug shadow-sm ${
                    m.de === "yo" ? "rounded-tr-none bg-wa-mine text-[#111]" : "rounded-tl-none bg-white text-[#111]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.texto}</p>
                  <span className="mt-0.5 block text-right text-[11px] text-black/45">
                    {m.hora}
                    {m.de === "yo" && <span className="ml-1 text-[#34b7f1]">✓✓</span>}
                  </span>
                </div>
              </li>
            ))}
            {enviando && (
              <li className="flex justify-start">
                <div className="rounded-lg rounded-tl-none bg-white px-3 py-2 shadow-sm">
                  <span className="inline-flex gap-1 align-middle">
                    <i className="h-2 w-2 animate-bounce rounded-full bg-black/40 [animation-delay:0ms]" />
                    <i className="h-2 w-2 animate-bounce rounded-full bg-black/40 [animation-delay:150ms]" />
                    <i className="h-2 w-2 animate-bounce rounded-full bg-black/40 [animation-delay:300ms]" />
                  </span>
                </div>
              </li>
            )}
          </ul>
          {error && <p className="mx-auto mt-3 w-fit rounded-lg bg-fj-danger-soft px-3 py-1.5 text-xs text-fj-danger">{error}</p>}
          <div ref={fin} />
        </div>

        <form onSubmit={enviar} className="flex items-center gap-2 border-t border-black/5 bg-[#f0f0f0] px-3 py-2">
          <input
            ref={campo}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe un mensaje"
            aria-label="Mensaje"
            autoComplete="off"
            className="flex-1 rounded-full border border-transparent bg-white px-4 py-2.5 text-[15px] text-[#111] outline-none focus:border-wa-send/40"
          />
          <button
            type="submit"
            disabled={!texto.trim() || enviando || !sessionId}
            aria-label="Enviar"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-wa-send text-white disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
            </svg>
          </button>
        </form>

        {toast && (
          <div role="status" className="absolute left-1/2 top-16 -translate-x-1/2 rounded-full bg-fj-navy px-4 py-2 text-sm font-medium text-white shadow-lg">
            ✓ {toast}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-fj-muted">
        <span className="font-mono">sesión {sessionId.slice(0, 18)}…</span>
        {avisosRegistrados > 0 && (
          <Link href="/avisos?canal=chat" className="font-medium text-fj-navy hover:underline">
            {avisosRegistrados} {avisosRegistrados === 1 ? "aviso registrado" : "avisos registrados"} en esta sesión → ver en la bandeja
          </Link>
        )}
      </div>
    </div>
  );
}
