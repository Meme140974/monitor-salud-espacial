/**
 * Rutina del día: tareas de salud con icono por tipo, puntos y racha.
 * Completar una tarea dibuja la marca y muestra los puntos ganados.
 */
import { Check, Fire, Star } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { api, Tarea } from "../api";
import { iconoTarea } from "../iconos";

export default function Rutina() {
  const [tareas, setTareas] = useState<Tarea[] | null>(null);
  const [puntos, setPuntos] = useState<number | null>(null);
  const [racha, setRacha] = useState<number | null>(null);
  const [recienGanados, setRecienGanados] = useState<Record<number, number>>({});
  const [ocupada, setOcupada] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .tareasHoy()
      .then(setTareas)
      .catch(() => {
        setTareas([]);
        setError("No se pudo cargar la rutina. Revisa la conexión con la nave.");
      });
    api
      .dashboard()
      .then((d) => {
        setPuntos(d.puntos);
        setRacha(d.racha_dias);
      })
      .catch(() => {});
  }, []);

  const completar = async (t: Tarea) => {
    if (t.completada || ocupada !== null) return;
    setOcupada(t.id);
    setError(null);
    try {
      const r = await api.completarTarea(t.id);
      setTareas((prev) => prev?.map((x) => (x.id === t.id ? { ...x, completada: true } : x)) ?? prev);
      setPuntos(r.puntos_totales);
      setRacha(r.racha_dias);
      if (r.puntos_ganados > 0) setRecienGanados((prev) => ({ ...prev, [t.id]: r.puntos_ganados }));
    } catch {
      setError("No se pudo guardar la tarea. Intenta de nuevo.");
    } finally {
      setOcupada(null);
    }
  };

  const lista = tareas ?? [];
  const hechas = lista.filter((t) => t.completada).length;
  const avance = lista.length ? hechas / lista.length : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.025em]">Rutina de hoy</h1>
          <p className="mt-1.5 text-sm text-tenue">Cada tarea protege un sistema de tu cuerpo.</p>
        </div>
        <dl className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-marfil" aria-hidden />
            <dt className="sr-only">Puntos de misión</dt>
            <dd>
              <span className="cifra text-base font-medium">{puntos ?? "—"}</span> <span className="text-tenue">pts</span>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <Fire size={16} className="text-ambar" aria-hidden />
            <dt className="sr-only">Racha</dt>
            <dd>
              <span className="cifra text-base font-medium">{racha ?? "—"}</span> <span className="text-tenue">días de racha</span>
            </dd>
          </div>
        </dl>
      </header>

      <div className="rounded-hoja border border-linea bg-panel p-5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">Avance del día</span>
          <span className="cifra text-tenue">
            {hechas} / {lista.length}
          </span>
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel2"
          role="progressbar"
          aria-valuenow={hechas}
          aria-valuemin={0}
          aria-valuemax={lista.length}
          aria-label="Avance de la rutina"
        >
          <div
            className="h-full origin-left rounded-full bg-verde transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `scaleX(${avance})` }}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-rojo">
          {error}
        </p>
      )}

      {tareas === null ? (
        <div className="space-y-2" aria-busy="true" aria-label="Cargando rutina">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-hoja bg-panel" />
          ))}
        </div>
      ) : lista.length === 0 && !error ? (
        <p className="rounded-hoja border border-linea bg-panel p-8 text-center text-sm text-tenue">
          No hay tareas programadas para hoy.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-hoja border border-linea bg-panel">
          {lista.map((t, i) => {
            const Icono = iconoTarea(t.titulo, t.descripcion);
            return (
              <li key={t.id} className="border-b border-linea last:border-b-0">
                <button
                  onClick={() => completar(t)}
                  disabled={t.completada || ocupada !== null}
                  aria-label={t.completada ? `${t.titulo}: completada` : `Completar: ${t.titulo}`}
                  className={`anim-subir flex w-full items-center gap-4 px-5 py-4 text-left transition-colors ${
                    t.completada ? "" : "hover:bg-panel2 disabled:cursor-wait"
                  }`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      t.completada ? "bg-verde/15 text-verde" : "bg-panel2 text-marfil"
                    }`}
                  >
                    <Icono size={18} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-medium ${t.completada ? "text-tenue line-through decoration-linea2" : ""}`}>
                      {t.titulo}
                    </span>
                    {t.descripcion && <span className="mt-0.5 block text-sm leading-relaxed text-tenue">{t.descripcion}</span>}
                  </span>
                  <span className="cifra shrink-0 text-xs text-tenue">
                    {recienGanados[t.id] ? (
                      <span className="anim-flotar-pts font-medium text-verde">+{recienGanados[t.id]} pts</span>
                    ) : (
                      `${t.puntos} pts`
                    )}
                  </span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      t.completada ? "border-verde bg-verde/15" : "border-linea2"
                    }`}
                    aria-hidden
                  >
                    {t.completada && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8FB8A0" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path className={recienGanados[t.id] ? "check-dibujo" : ""} d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {lista.length > 0 && hechas === lista.length && (
        <p className="anim-subir flex items-center justify-center gap-2 rounded-hoja border border-verde/30 bg-verde/5 p-4 text-center text-sm text-verde">
          <Check size={16} aria-hidden />
          Rutina completa. Tu yo del día 500 te lo va a agradecer.
        </p>
      )}
    </div>
  );
}
