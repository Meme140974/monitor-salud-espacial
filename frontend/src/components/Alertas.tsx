/**
 * Alertas abiertas. Una alerta con escalar_a_tierra indica contactar a los
 * cirujanos de vuelo. Al atenderse, sale con una transición corta.
 */
import { Checks, WarningOctagon, Broadcast, Warning } from "@phosphor-icons/react";
import { useState } from "react";
import { Alerta, api, COLOR_ESTADO, TEXTO_ESTADO } from "../api";

export default function Alertas({ alertas, onCambio }: { alertas: Alerta[]; onCambio: () => void }) {
  const [ocupada, setOcupada] = useState<number | null>(null);
  const [saliendo, setSaliendo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (alertas.length === 0) return null;

  const atender = async (id: number) => {
    setOcupada(id);
    setError(null);
    try {
      await api.atenderAlerta(id);
      setSaliendo(id);
      setTimeout(onCambio, 360);
    } catch {
      setError("No se pudo marcar la alerta. Revisa la conexión e intenta de nuevo.");
    } finally {
      setOcupada(null);
    }
  };

  return (
    <section aria-label="Alertas de salud" className="space-y-2">
      {alertas.map((a, i) => {
        const color = COLOR_ESTADO[a.nivel];
        const Icono = a.nivel === "rojo" ? WarningOctagon : Warning;
        return (
          <article
            key={a.id}
            className={`anim-subir rounded-hoja border bg-panel p-4 ${saliendo === a.id ? "alerta-saliendo" : ""}`}
            style={{
              borderColor: a.nivel === "rojo" ? `${color}55` : "#252A32",
              animationDelay: `${i * 0.06}s`,
            }}
          >
            <div className="flex gap-3.5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${color}1a`, color }}
              >
                <Icono size={18} className={a.nivel === "rojo" ? "anim-pulso" : ""} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <h3 className="font-medium">{a.titulo}</h3>
                  <span className="text-xs font-medium" style={{ color }}>
                    {TEXTO_ESTADO[a.nivel]}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-tenue">{a.mensaje}</p>
                {a.recomendacion && (
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-medium text-marfil">Qué hacer: </span>
                    {a.recomendacion}
                  </p>
                )}
                {a.escalar_a_tierra && (
                  <p className="mt-2.5 inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium" style={{ color, background: "#1A1E24" }}>
                    <Broadcast size={15} aria-hidden />
                    Notifica a los cirujanos de vuelo en tierra
                  </p>
                )}
              </div>
              <button
                onClick={() => atender(a.id)}
                disabled={ocupada === a.id}
                aria-label={`Marcar atendida: ${a.titulo}`}
                className="flex h-9 shrink-0 items-center gap-2 self-start rounded-md border border-linea2 px-3 text-sm text-tinta transition-colors hover:border-marfil/50 hover:bg-panel2 disabled:cursor-wait disabled:opacity-50"
              >
                <Checks size={15} aria-hidden />
                <span className="hidden sm:inline">{ocupada === a.id ? "Guardando…" : "Marcar atendida"}</span>
              </button>
            </div>
          </article>
        );
      })}
      {error && (
        <p role="alert" className="text-sm text-rojo">
          {error}
        </p>
      )}
    </section>
  );
}
