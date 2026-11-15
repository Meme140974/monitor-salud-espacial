/**
 * Fila de un indicador: estado con icono (nunca solo color), nombre, marca de
 * valor inusual, historial reciente, valor en cifras tabulares y tendencia.
 */
import { ArrowDownRight, ArrowRight, ArrowUpRight, CaretRight, Sparkle } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { COLOR_ESTADO, TarjetaIndicador, TEXTO_ESTADO } from "../api";
import { ICONO_ESTADO } from "../iconos";

const ICONO_TENDENCIA = { subiendo: ArrowUpRight, bajando: ArrowDownRight, estable: ArrowRight } as const;
const TEXTO_TENDENCIA = { subiendo: "Subiendo", bajando: "Bajando", estable: "Estable" } as const;

function decimales(valor: number): number {
  const texto = String(valor);
  return texto.includes(".") ? Math.min(2, texto.split(".")[1].length) : 0;
}

/** Cifra que cuenta hasta su valor al aparecer (respeta reduced-motion). */
function Contador({ valor }: { valor: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const dec = decimales(valor);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t0 = performance.now();
    let anim = 0;
    const paso = (t: number) => {
      const k = Math.min(1, (t - t0) / 800);
      el.textContent = (valor * (1 - Math.pow(1 - k, 4))).toFixed(dec);
      if (k < 1) anim = requestAnimationFrame(paso);
    };
    anim = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(anim);
  }, [valor, dec]);
  return <span ref={ref}>{valor.toFixed(dec)}</span>;
}

function Historial({ datos, color }: { datos: number[]; color: string }) {
  if (datos.length < 2) return <span className="block h-6 w-full" />;
  const w = 100;
  const h = 24;
  const min = Math.min(...datos);
  const max = Math.max(...datos);
  const rango = max - min || 1;
  const y = (v: number) => h - 3 - ((v - min) / rango) * (h - 6);
  const pts = datos.map((v, i) => `${(i / (datos.length - 1)) * w},${y(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block h-6 w-full overflow-visible" aria-hidden>
      <polyline points={pts} fill="none" stroke="#454C59" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
      <circle cx={w} cy={y(datos[datos.length - 1])} r="2.4" fill={color} />
    </svg>
  );
}

export default function FilaVital({ dato, orden = 0 }: { dato: TarjetaIndicador; orden?: number }) {
  const color = COLOR_ESTADO[dato.estado];
  const IconoEstado = ICONO_ESTADO[dato.estado];
  const IconoTendencia = ICONO_TENDENCIA[dato.tendencia];

  return (
    <li className="anim-subir" style={{ animationDelay: `${0.05 + orden * 0.035}s` }}>
      <Link
        to={`/indicador/${dato.id}`}
        className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-3.5 transition-colors hover:bg-panel2 sm:grid-cols-[minmax(0,1fr)_64px_minmax(92px,auto)_16px] sm:px-5"
      >
        <span className="flex min-w-0 items-start gap-3">
          <IconoEstado size={16} style={{ color }} className="mt-0.5 shrink-0" aria-hidden />
          <span className="min-w-0">
            <span className="block text-sm leading-snug">{dato.nombre}</span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="font-medium" style={{ color }}>
                {TEXTO_ESTADO[dato.estado]}
              </span>
              <span className="flex items-center gap-1 text-tenue">
                <IconoTendencia size={13} aria-hidden />
                {TEXTO_TENDENCIA[dato.tendencia]}
              </span>
              {dato.anomalia && (
                <span
                  className="flex items-center gap-1 rounded-md bg-marfil/10 px-1.5 py-px text-[11px] font-medium text-marfil"
                  title="El análisis detectó un valor inusual para ti"
                >
                  <Sparkle size={12} aria-hidden /> Inusual
                </span>
              )}
            </span>
          </span>
        </span>

        <span className="hidden sm:block">{dato.chispa && <Historial datos={dato.chispa} color={color} />}</span>

        <span className="cifra whitespace-nowrap text-right">
          <span className="text-lg font-medium">
            <Contador valor={dato.ultimo_valor} />
          </span>
          <span className="ml-1 text-xs text-tenue">{dato.unidad}</span>
        </span>

        <CaretRight size={15} className="hidden text-tenue transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden />
      </Link>
    </li>
  );
}
