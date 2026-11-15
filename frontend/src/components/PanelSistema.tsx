/**
 * Detalle del sistema elegido en la figura: qué hace, cómo lo afecta el
 * espacio y sus indicadores con estado actual.
 */
import { CaretRight, Radioactive, X } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { COLOR_ESTADO, Indicador, Sistema, TarjetaIndicador, TEXTO_ESTADO } from "../api";
import { ICONO_ESTADO, iconoSistema } from "../iconos";

interface Props {
  sistema: Sistema;
  indicadores: Indicador[];
  tarjetas: TarjetaIndicador[];
  onCerrar: () => void;
}

export default function PanelSistema({ sistema, indicadores, tarjetas, onCerrar }: Props) {
  const propios = indicadores.filter((i) => i.sistema === sistema.id);
  const estadoDe = (id: number) => tarjetas.find((t) => t.id === id);
  const color = COLOR_ESTADO[sistema.estado];
  const Icono = iconoSistema(sistema.clave);
  const IconoEstado = ICONO_ESTADO[sistema.estado];

  return (
    <aside
      className="anim-subir rounded-hoja border border-linea bg-panel p-5 shadow-hoja"
      aria-label={`Detalle del sistema ${sistema.nombre}`}
    >
      <div className="flex items-start gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-panel2 text-marfil">
          <Icono size={19} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-[-0.01em]">{sistema.nombre}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm" style={{ color }}>
            <IconoEstado size={14} aria-hidden />
            {TEXTO_ESTADO[sistema.estado]}
          </p>
        </div>
        <button
          onClick={onCerrar}
          aria-label="Cerrar detalle del sistema"
          className="flex h-8 w-8 items-center justify-center rounded-md text-tenue transition-colors hover:bg-panel2 hover:text-tinta"
        >
          <X size={17} />
        </button>
      </div>

      <p className="mt-4 max-w-[65ch] text-sm leading-relaxed text-tenue">{sistema.descripcion}</p>

      <div className="mt-4 flex gap-3 border-t border-linea pt-4 text-sm leading-relaxed">
        <Radioactive size={16} className="mt-0.5 shrink-0 text-marfil" aria-hidden />
        <p>
          <span className="font-medium text-marfil">En el espacio: </span>
          {sistema.riesgo_espacial}
        </p>
      </div>

      {propios.length > 0 && (
        <ul className="mt-4 divide-y divide-linea border-t border-linea">
          {propios.map((ind) => {
            const t = estadoDe(ind.id);
            const IconoT = t ? ICONO_ESTADO[t.estado] : null;
            return (
              <li key={ind.id}>
                <Link
                  to={`/indicador/${ind.id}`}
                  className="group flex items-center gap-3 rounded-md py-3 transition-colors hover:text-marfil"
                >
                  {IconoT && t ? (
                    <IconoT size={15} style={{ color: COLOR_ESTADO[t.estado] }} aria-label={TEXTO_ESTADO[t.estado]} />
                  ) : (
                    <span className="h-[15px] w-[15px]" />
                  )}
                  <span className="text-sm">{ind.nombre}</span>
                  {t && (
                    <span className="cifra ml-auto whitespace-nowrap text-sm text-tenue">
                      {t.ultimo_valor} <span className="text-xs">{t.unidad}</span>
                    </span>
                  )}
                  <CaretRight size={15} className="text-tenue transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
