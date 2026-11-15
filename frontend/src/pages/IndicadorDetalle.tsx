/**
 * Detalle de un indicador: gráfica de evolución con bandas de umbral,
 * selector de rango, explicación/instrucciones y registro de una medición
 * con la evaluación inmediata del motor de reglas.
 */
import { ArrowLeft, BookOpenText, PencilSimpleLine, ChartLine as IconoGrafica, Broadcast, Sparkle } from "@phosphor-icons/react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, COLOR_ESTADO, Indicador, ResultadoMedicion, Serie, TEXTO_ESTADO } from "../api";
import { ICONO_ESTADO } from "../iconos";

const RANGOS = [7, 30, 90] as const;

/** Paso de eje "redondo" (1, 2, 5 × 10^n) para marcas legibles. */
function pasoRedondo(bruto: number): number {
  const base = Math.pow(10, Math.floor(Math.log10(bruto || 1)));
  const f = bruto / base;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * base;
}

function marcas([lo, hi]: [number, number]): number[] {
  const paso = pasoRedondo((hi - lo) / 4);
  const r: number[] = [];
  for (let v = Math.ceil(lo / paso) * paso; v <= hi + 1e-9; v += paso) r.push(Number(v.toFixed(6)));
  return r;
}
const reducido = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function IndicadorDetalle() {
  const { id } = useParams();
  const idNum = Number(id);
  const [indicador, setIndicador] = useState<Indicador | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [serie, setSerie] = useState<Serie | null>(null);
  const [dias, setDias] = useState<(typeof RANGOS)[number]>(30);
  const [valor, setValor] = useState("");
  const [resultado, setResultado] = useState<ResultadoMedicion | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .indicadores()
      .then((todos) => {
        const encontrado = todos.find((i) => i.id === idNum) ?? null;
        setIndicador(encontrado);
        setNoEncontrado(!encontrado);
      })
      .catch(() => setNoEncontrado(true));
  }, [idNum]);

  useEffect(() => {
    api.serie(idNum, dias).then(setSerie).catch(() => setSerie(null));
  }, [idNum, dias, resultado]);

  const datosGrafica = useMemo(
    () =>
      (serie?.puntos ?? []).map((p) => ({
        ...p,
        etiqueta: new Date(p.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
      })),
    [serie]
  );

  const dominio = useMemo<[number, number]>(() => {
    if (!serie || serie.puntos.length === 0) return [0, 100];
    const valores = serie.puntos.map((p) => p.valor);
    const [vLo, vHi] = serie.umbrales.verde;
    const lo = Math.min(...valores, vLo);
    const hi = Math.max(...valores, vHi);
    const margen = (hi - lo || 1) * 0.15;
    const paso = pasoRedondo((hi - lo + 2 * margen) / 4);
    return [Math.floor((lo - margen) / paso) * paso, Math.ceil((hi + margen) / paso) * paso];
  }, [serie]);

  const ultimo = serie?.puntos[serie.puntos.length - 1];

  const registrar = async (e: FormEvent) => {
    e.preventDefault();
    const v = Number(valor.replace(",", "."));
    if (Number.isNaN(v)) {
      setError("Escribe solo números, por ejemplo 72 o 36.6.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const r = await api.registrarMedicion(idNum, v);
      setResultado(r);
      setValor("");
    } catch {
      setError("No se pudo guardar la medición. Revisa la conexión e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  if (noEncontrado)
    return (
      <div className="mx-auto mt-16 max-w-md text-center">
        <p className="font-medium">No encontramos este indicador</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-1.5 text-sm text-marfil underline">
          <ArrowLeft size={15} aria-hidden /> Volver al estado general
        </Link>
      </div>
    );

  if (!indicador)
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Cargando indicador">
        <div className="h-10 w-64 animate-pulse rounded-md bg-panel" />
        <div className="h-80 animate-pulse rounded-hoja bg-panel" />
      </div>
    );

  const recorte = (r: [number, number]): [number, number] => [Math.max(r[0], dominio[0]), Math.min(r[1], dominio[1])];
  const IconoUltimo = ultimo ? ICONO_ESTADO[ultimo.estado] : null;

  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded-md text-sm text-tenue transition-colors hover:text-tinta"
      >
        <ArrowLeft size={15} aria-hidden /> Estado general
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.025em]">{indicador.nombre}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tenue">
            <span>Se mide en {indicador.unidad}</span>
            {ultimo && IconoUltimo && (
              <span className="flex items-center gap-1.5">
                Última:
                <span className="cifra text-tinta">
                  {ultimo.valor} {indicador.unidad}
                </span>
                <span className="flex items-center gap-1" style={{ color: COLOR_ESTADO[ultimo.estado] }}>
                  <IconoUltimo size={13} aria-hidden />
                  {TEXTO_ESTADO[ultimo.estado]}
                </span>
              </span>
            )}
          </p>
        </div>
        <div role="group" aria-label="Rango de días" className="flex rounded-lg border border-linea bg-panel p-1">
          {RANGOS.map((r) => (
            <button
              key={r}
              onClick={() => setDias(r)}
              aria-pressed={dias === r}
              className={`h-8 rounded-md px-3 text-sm transition-colors ${
                dias === r ? "bg-panel2 text-tinta shadow-[inset_0_0_0_1px_#323843]" : "text-tenue hover:text-tinta"
              }`}
            >
              <span className="cifra">{r}</span> días
            </button>
          ))}
        </div>
      </header>

      <section aria-label="Evolución en el tiempo" className="rounded-hoja border border-linea bg-panel p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-tenue">
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-4 rounded-sm bg-verde/20" /> Rango saludable
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-4 rounded-sm bg-ambar/20" /> Rango por vigilar
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-4 rounded-sm bg-rojo/20" /> Rango crítico
          </span>
        </div>
        {datosGrafica.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center gap-2 text-center">
            <IconoGrafica size={22} className="text-tenue" aria-hidden />
            <p className="text-sm text-tenue">Sin mediciones en este rango. Registra la primera abajo.</p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <LineChart data={datosGrafica} margin={{ top: 8, right: 20, bottom: 0, left: -12 }}>
                <ReferenceArea
                  y1={recorte(indicador.umbrales.verde)[0]}
                  y2={recorte(indicador.umbrales.verde)[1]}
                  fill="#8FB8A0"
                  fillOpacity={0.08}
                />
                {indicador.umbrales.amarillo.map((r, i) => (
                  <ReferenceArea key={`a${i}`} y1={recorte(r)[0]} y2={recorte(r)[1]} fill="#D2B07A" fillOpacity={0.07} />
                ))}
                {indicador.umbrales.rojo.map((r, i) =>
                  recorte(r)[0] < recorte(r)[1] ? (
                    <ReferenceArea key={`r${i}`} y1={recorte(r)[0]} y2={recorte(r)[1]} fill="#D98B7E" fillOpacity={0.07} />
                  ) : null
                )}
                <CartesianGrid stroke="#252A32" vertical={false} />
                <XAxis
                  dataKey="etiqueta"
                  stroke="#99A0AB"
                  tick={{ fontSize: 11, fontFamily: "Atkinson Hyperlegible Mono" }}
                  tickLine={false}
                  axisLine={{ stroke: "#323843" }}
                  minTickGap={28}
                />
                <YAxis
                  domain={dominio}
                  ticks={marcas(dominio)}
                  stroke="#99A0AB"
                  tick={{ fontSize: 11, fontFamily: "Atkinson Hyperlegible Mono" }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />
                <Tooltip
                  cursor={{ stroke: "#454C59" }}
                  contentStyle={{
                    background: "#1A1E24",
                    border: "1px solid #323843",
                    borderRadius: 10,
                    fontSize: 12,
                    fontFamily: "Atkinson Hyperlegible Next",
                  }}
                  labelStyle={{ color: "#99A0AB" }}
                  itemStyle={{ color: "#EDEFF2" }}
                  formatter={(v: number) => [`${v} ${indicador.unidad}`, indicador.nombre]}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#E8E2D4"
                  strokeWidth={1.75}
                  isAnimationActive={!reducido()}
                  animationDuration={1100}
                  activeDot={{ r: 5, fill: "#E8E2D4", stroke: "#0B0D10", strokeWidth: 2 }}
                  dot={(props: any) => (
                    <circle
                      key={props.payload.fecha}
                      cx={props.cx}
                      cy={props.cy}
                      r={3}
                      stroke="#13161B"
                      strokeWidth={1.5}
                      fill={COLOR_ESTADO[props.payload.estado as keyof typeof COLOR_ESTADO]}
                    />
                  )}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="Qué es y cómo medirlo" className="rounded-hoja border border-linea bg-panel p-5">
          <div className="flex gap-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-panel2 text-marfil">
              <BookOpenText size={17} aria-hidden />
            </span>
            <div>
              <h2 className="font-medium">Por qué importa</h2>
              <p className="mt-1.5 max-w-[65ch] text-sm leading-relaxed text-tenue">{indicador.explicacion}</p>
            </div>
          </div>
          <div className="mt-5 flex gap-3.5 border-t border-linea pt-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-panel2 text-marfil">
              <PencilSimpleLine size={17} aria-hidden />
            </span>
            <div>
              <h2 className="font-medium">Cómo medirlo</h2>
              <p className="mt-1.5 max-w-[65ch] text-sm leading-relaxed text-tenue">{indicador.instrucciones}</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="titulo-registro" className="rounded-hoja border border-linea bg-panel p-5">
          <h2 id="titulo-registro" className="font-medium">
            Registrar una medición
          </h2>
          <p className="mt-1 text-sm text-tenue">Se evalúa al momento contra tus umbrales.</p>
          <form onSubmit={registrar} className="mt-4 flex gap-2">
            <label className="relative w-full">
              <span className="sr-only">Valor en {indicador.unidad}</span>
              <input
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Valor"
                aria-invalid={error ? true : undefined}
                className="cifra h-11 w-full rounded-md border border-linea2 bg-fondo pl-3.5 pr-20 text-[15px] text-tinta placeholder:text-tenue focus:border-marfil/70 focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-tenue">
                {indicador.unidad}
              </span>
            </label>
            <button
              type="submit"
              disabled={enviando || valor.trim() === ""}
              className="h-11 shrink-0 rounded-md bg-marfil px-5 text-sm font-medium text-fondo transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {enviando ? "Evaluando…" : "Guardar"}
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-2 text-sm text-rojo">
              {error}
            </p>
          )}

          {resultado && <Resultado r={resultado} unidad={indicador.unidad} />}
        </section>
      </div>
    </div>
  );
}

function Resultado({ r, unidad }: { r: ResultadoMedicion; unidad: string }) {
  const color = COLOR_ESTADO[r.estado];
  const Icono = ICONO_ESTADO[r.estado];
  return (
    <div
      className="anim-subir mt-5 rounded-lg border p-4"
      style={{ borderColor: `${color}55`, background: `${color}0d` }}
      role="status"
    >
      <p className="flex flex-wrap items-center gap-2 text-sm font-medium" style={{ color }}>
        <Icono size={16} aria-hidden />
        {TEXTO_ESTADO[r.estado]}
        <span className="cifra text-tinta">
          {r.valor} {unidad}
        </span>
        {r.anomalia && (
          <span className="flex items-center gap-1 rounded-md bg-marfil/10 px-1.5 py-0.5 text-[11px] text-marfil">
            <Sparkle size={12} aria-hidden /> Inusual para ti
          </span>
        )}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-tenue">{r.mensaje}</p>
      {r.recomendacion && (
        <p className="mt-2 text-sm leading-relaxed">
          <span className="font-medium text-marfil">Qué hacer: </span>
          {r.recomendacion}
        </p>
      )}
      {r.escalar_a_tierra && (
        <p className="mt-2.5 flex items-center gap-2 text-sm font-medium text-rojo">
          <Broadcast size={15} aria-hidden />
          Notifica a los cirujanos de vuelo en tierra
        </p>
      )}
    </div>
  );
}
