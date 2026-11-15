/**
 * Capa general: cabecera de misión, navegación y contenido.
 * La cabecera es el estado de la nave: misión, día, entorno, puntos y racha.
 */
import { Pulse, ClipboardText, Fire, SignOut, Star } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { api, cerrarSesion, DatosDashboard, NOMBRE_ENTORNO } from "../api";

export function Marca({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="15" stroke="#323843" />
      <ellipse cx="16" cy="16" rx="15" ry="5.5" stroke="#E8E2D4" strokeOpacity="0.55" transform="rotate(-24 16 16)" />
      <circle cx="16" cy="10.5" r="3" fill="#E8E2D4" />
      <path d="M10.5 24c.8-4.4 2.9-6.8 5.5-6.8s4.7 2.4 5.5 6.8" stroke="#E8E2D4" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Capa() {
  const [datos, setDatos] = useState<DatosDashboard | null>(null);
  const navegar = useNavigate();

  useEffect(() => {
    api.dashboard().then(setDatos).catch(() => {});
  }, []);

  const enlace = ({ isActive }: { isActive: boolean }) =>
    `flex h-8 items-center gap-2 rounded-md px-3 text-sm transition-colors duration-200 ${
      isActive ? "bg-panel2 text-tinta shadow-[inset_0_0_0_1px_#323843]" : "text-tenue hover:text-tinta"
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-linea bg-fondo/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-3 px-4 sm:gap-6 sm:px-8">
          <Link to="/" className="mr-auto flex min-w-0 items-center gap-3 rounded-md">
            <Marca />
            <span className="hidden min-w-0 leading-tight sm:block">
              <span className="block text-[15px] font-semibold tracking-[-0.01em]">Monitor de salud</span>
              <span className="block truncate text-xs text-tenue">
                {datos
                  ? `${datos.mision.nombre} · día ${datos.mision.dia} · ${NOMBRE_ENTORNO[datos.mision.entorno]}`
                  : "Conectando con la nave…"}
              </span>
            </span>
          </Link>

          <nav aria-label="Secciones" className="flex items-center gap-1 rounded-lg border border-linea bg-panel p-1">
            <NavLink to="/" end className={enlace}>
              <Pulse size={15} aria-hidden /> <span>Estado</span>
            </NavLink>
            <NavLink to="/rutina" className={enlace}>
              <ClipboardText size={15} aria-hidden /> Rutina
            </NavLink>
          </nav>

          {datos && (
            <div className="hidden items-center gap-5 text-sm md:flex">
              <span className="flex items-center gap-1.5" title="Puntos de misión">
                <Star size={15} className="text-marfil" aria-hidden />
                <span className="cifra">{datos.puntos}</span>
                <span className="text-tenue">pts</span>
              </span>
              <span className="flex items-center gap-1.5" title="Racha de días con rutina completa">
                <Fire size={15} className="text-ambar" aria-hidden />
                <span className="cifra">{datos.racha_dias}</span>
                <span className="text-tenue">días</span>
              </span>
            </div>
          )}

          <button
            onClick={() => {
              cerrarSesion();
              navegar("/login");
            }}
            aria-label="Salir"
            className="flex h-9 items-center gap-2 rounded-md px-2.5 text-sm text-tenue transition-colors hover:bg-panel2 hover:text-tinta"
          >
            <SignOut size={15} aria-hidden />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-5 py-8 sm:px-8">
        <Outlet />
      </main>

      <footer className="mx-auto w-full max-w-[1320px] border-t border-linea px-5 py-6 text-xs text-tenue sm:px-8">
        Esta herramienta apoya la autoevaluación; no sustituye el juicio de los cirujanos de vuelo ni de un médico.
      </footer>
    </div>
  );
}
