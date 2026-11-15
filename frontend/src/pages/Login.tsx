/**
 * Acceso a la consola: credenciales a la izquierda y, en pantallas anchas,
 * el cuerpo 3D en reposo girando despacio a la derecha.
 */
import { Eye, EyeSlash, SignIn } from "@phosphor-icons/react";
import { lazy, Suspense, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { Marca } from "../components/Capa";

const Cuerpo3D = lazy(() => import("../components/Cuerpo3D"));

export default function Login() {
  const [usuario, setUsuario] = useState("astronauta");
  const [clave, setClave] = useState("");
  const [ver, setVer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const navegar = useNavigate();

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.login(usuario, clave);
      navegar("/");
    } catch {
      setError("Usuario o contraseña incorrectos. Revisa los datos e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const campo =
    "mt-1.5 h-11 w-full rounded-md border border-linea2 bg-fondo px-3.5 text-[15px] text-tinta placeholder:text-tenue transition-colors focus:border-marfil/70 focus:outline-none";

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(420px,1fr)_1.25fr]">
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center gap-3">
          <Marca size={30} />
          <span className="text-[15px] font-semibold">Monitor de salud</span>
        </div>

        <div className="anim-subir mx-auto w-full max-w-sm py-12">
          <h1 className="text-balance text-[34px] font-bold leading-[1.08] tracking-[-0.025em]">Consola médica de a bordo</h1>
          <p className="mt-2 text-sm leading-relaxed text-tenue">
            Inicia sesión para ver el estado de tu cuerpo y la rutina del día.
          </p>

          <form onSubmit={entrar} className="mt-9 space-y-5">
            <label className="block">
              <span className="text-sm font-medium">Usuario</span>
              <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" className={campo} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Contraseña</span>
              <span className="relative block">
                <input
                  type={ver ? "text" : "password"}
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  autoComplete="current-password"
                  aria-invalid={error ? true : undefined}
                  className={`${campo} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setVer((v) => !v)}
                  aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-1.5 top-[calc(50%+3px)] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-tenue hover:text-tinta"
                >
                  {ver ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

            {error && (
              <p role="alert" className="text-sm text-rojo">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando || clave === ""}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-marfil text-sm font-medium text-fondo transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <SignIn size={16} aria-hidden />
              {enviando ? "Verificando…" : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-6 text-xs text-tenue">
            Demo: <span className="cifra text-tinta">astronauta</span> / <span className="cifra text-tinta">artemis2026</span>
          </p>
        </div>

        <p className="text-xs text-tenue">Apoya la autoevaluación; no sustituye a los cirujanos de vuelo.</p>
      </div>

      <div
        className="relative hidden overflow-hidden border-l border-linea bg-panel lg:block"
        style={{ backgroundImage: "radial-gradient(ellipse 55% 45% at 50% 80%, rgba(232,226,212,0.08), transparent 70%)" }}
      >
        <Suspense fallback={null}>
          <div className="anim-aparecer absolute inset-0">
            <Cuerpo3D decorativo className="h-full w-full" />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
