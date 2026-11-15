/**
 * Pantalla principal: resumen, alertas abiertas, cuerpo 3D con sus sistemas
 * y tabla de indicadores. El panel del sistema se abre al elegir una zona.
 */
import { ArrowsClockwise, HandGrabbing } from "@phosphor-icons/react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { api, COLOR_ESTADO, DatosDashboard, Estado, Indicador, Sistema, TEXTO_ESTADO } from "../api";
import Alertas from "../components/Alertas";
import FilaVital from "../components/FilaVital";
import PanelSistema from "../components/PanelSistema";
import { ICONO_ESTADO, iconoSistema } from "../iconos";

const Cuerpo3D = lazy(() => import("../components/Cuerpo3D"));
const reducidoMov = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function resumen(sistemas: Sistema[]): string {
  const cuenta = (e: Estado) => sistemas.filter((s) => s.estado === e).length;
  const [r, a] = [cuenta("rojo"), cuenta("amarillo")];
  if (sistemas.length === 0) return "";
  if (r === 0 && a === 0) return "Todos los sistemas están en rango saludable.";
  const partes = [];
  if (r) partes.push(`${r} ${r === 1 ? "sistema crítico" : "sistemas críticos"}`);
  if (a) partes.push(`${a} por vigilar`);
  return `${partes.join(" y ")} de ${sistemas.length}. Toca una zona del cuerpo para ver por qué.`;
}

export default function Dashboard() {
  const [datos, setDatos] = useState<DatosDashboard | null>(null);
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [seleccion, setSeleccion] = useState<Sistema | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    setError(null);
    setCargando(true);
    try {
      const [d, s, i] = await Promise.all([api.dashboard(), api.sistemas(), api.indicadores()]);
      setDatos(d);
      setSistemas(s);
      setIndicadores(i);
      setSeleccion((actual) => (actual ? s.find((x) => x.id === actual.id) ?? null : null));
    } catch {
      setError("No hay conexión con el servidor de la nave. Comprueba que el backend esté en marcha e intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const panel = useRef<HTMLDivElement>(null);
  const alternar = (s: Sistema) => setSeleccion((actual) => (actual?.id === s.id ? null : s));

  // En pantallas estrechas el detalle queda bajo la figura: se lleva a la vista.
  useEffect(() => {
    if (!seleccion || window.matchMedia("(min-width: 1024px)").matches) return;
    panel.current?.scrollIntoView({ behavior: reducidoMov() ? "auto" : "smooth", block: "start" });
  }, [seleccion?.id]);

  if (error)
    return (
      <div className="mx-auto mt-16 max-w-md rounded-hoja border border-linea bg-panel p-8 text-center">
        <p className="font-medium">Sin conexión</p>
        <p className="mt-2 text-sm leading-relaxed text-tenue">{error}</p>
        <button
          onClick={cargar}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-marfil px-4 text-sm font-medium text-fondo transition-opacity hover:opacity-90"
        >
          <ArrowsClockwise size={15} aria-hidden /> Reintentar
        </button>
      </div>
    );

  if (!datos)
    return (
      <div className="grid gap-6 lg:grid-cols-12" aria-busy="true" aria-label="Cargando estado">
        <div className="h-[620px] animate-pulse rounded-hoja bg-panel lg:col-span-7" />
        <div className="space-y-3 lg:col-span-5">
          <div className="h-20 animate-pulse rounded-hoja bg-panel" />
          <div className="h-[520px] animate-pulse rounded-hoja bg-panel" />
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.025em]">Estado de {datos.astronauta}</h1>
          <p className="mt-1.5 text-sm text-tenue">{resumen(sistemas)}</p>
        </div>
        <button
          onClick={cargar}
          disabled={cargando}
          className="flex h-9 items-center gap-2 rounded-md border border-linea px-3 text-sm text-tenue transition-colors hover:border-linea2 hover:text-tinta disabled:opacity-60"
        >
          <ArrowsClockwise size={14} className={cargando ? "animate-spin" : ""} aria-hidden />
          Actualizar
        </button>
      </header>

      <div className="lg:hidden">
        <Alertas alertas={datos.alertas} onCambio={cargar} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <section
          aria-label="Cuerpo y sistemas"
          className="relative overflow-hidden rounded-hoja border border-linea bg-panel lg:sticky lg:top-24 lg:col-span-7"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 45% at 50% 78%, rgba(232,226,212,0.07), transparent 70%)",
          }}
        >
          <div className="relative">
            <Suspense fallback={<div className="h-[440px] sm:h-[520px]" />}>
              <Cuerpo3D
                className="h-[440px] sm:h-[520px]"
                sistemas={sistemas}
                seleccionado={seleccion?.id ?? null}
                onSeleccionar={alternar}
              />
            </Suspense>
            <p className="pointer-events-none absolute bottom-3 left-5 z-10 flex items-center gap-2 text-xs text-tenue">
              <HandGrabbing size={14} aria-hidden /> Arrastra para girar · toca un punto
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-px border-t border-linea bg-linea sm:grid-cols-3" aria-label="Sistemas corporales">
            {sistemas.map((s) => {
              const Icono = iconoSistema(s.clave);
              const IconoEstado = ICONO_ESTADO[s.estado];
              const activo = seleccion?.id === s.id;
              return (
                <li key={s.id} className="bg-panel">
                  <button
                    onClick={() => alternar(s)}
                    aria-pressed={activo}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activo ? "bg-panel2 shadow-[inset_0_-2px_0_#E8E2D4]" : "hover:bg-panel2"
                    }`}
                  >
                    <Icono size={16} className={activo ? "text-marfil" : "text-tenue"} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug">{s.nombre}</span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: COLOR_ESTADO[s.estado] }}>
                        <IconoEstado size={12} aria-hidden />
                        {TEXTO_ESTADO[s.estado]}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-6 lg:col-span-5">
          <div className="hidden lg:block">
            <Alertas alertas={datos.alertas} onCambio={cargar} />
          </div>
          {seleccion && (
            <div ref={panel} className="scroll-mt-20">
            <PanelSistema
              key={seleccion.id}
              sistema={seleccion}
              indicadores={indicadores}
              tarjetas={datos.indicadores}
              onCerrar={() => setSeleccion(null)}
            />
            </div>
          )}

          <section aria-labelledby="titulo-indicadores" className="overflow-hidden rounded-hoja border border-linea bg-panel">
            <div className="flex items-baseline justify-between px-4 pb-3 pt-4 sm:px-5">
              <h2 id="titulo-indicadores" className="font-medium">
                Indicadores
              </h2>
              <span className="text-xs text-tenue">{datos.indicadores.length} en seguimiento</span>
            </div>
            <ul className="divide-y divide-linea border-t border-linea">
              {datos.indicadores.map((t, i) => (
                <FilaVital key={t.id} dato={t} orden={i} />
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
