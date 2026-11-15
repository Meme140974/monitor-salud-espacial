/**
 * Cliente de la API del backend (contrato v1 — plan-equipo-hackathon.md).
 * Base configurable con VITE_API_URL; por defecto el backend local.
 */

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

// ---------- Tipos del contrato ----------

export type Estado = "verde" | "amarillo" | "rojo";
export type Tendencia = "subiendo" | "bajando" | "estable";

export interface Umbrales {
  verde: [number, number];
  amarillo: [number, number][];
  rojo: [number, number][];
}

export interface Sistema {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string;
  riesgo_espacial: string;
  estado: Estado;
}

export interface Indicador {
  id: number;
  clave: string;
  nombre: string;
  unidad: string;
  sistema: number;
  explicacion: string;
  instrucciones: string;
  umbrales: Umbrales;
}

export interface TarjetaIndicador {
  id: number;
  clave: string;
  nombre: string;
  ultimo_valor: number;
  unidad: string;
  estado: Estado;
  tendencia: Tendencia;
  anomalia: boolean;
  /** Últimos valores en orden cronológico, para la mini-gráfica. */
  chispa?: number[];
}

export interface Alerta {
  id: number;
  nivel: "amarillo" | "rojo";
  titulo: string;
  mensaje: string;
  recomendacion: string;
  escalar_a_tierra: boolean;
  estado: "abierta" | "atendida";
}

export interface DatosDashboard {
  astronauta: string;
  mision: { nombre: string; dia: number; entorno: "iss" | "luna" | "marte" };
  puntos: number;
  racha_dias: number;
  indicadores: TarjetaIndicador[];
  alertas: Alerta[];
}

export interface PuntoSerie {
  fecha: string;
  valor: number;
  estado: Estado;
}

export interface Serie {
  indicador: number;
  unidad: string;
  umbrales: Umbrales;
  puntos: PuntoSerie[];
}

export interface ResultadoMedicion {
  id: number;
  indicador: number;
  valor: number;
  fecha: string;
  estado: Estado;
  mensaje: string;
  recomendacion: string;
  escalar_a_tierra: boolean;
  anomalia: boolean;
}

export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  puntos: number;
  completada: boolean;
}

export interface ResultadoTarea {
  completada: boolean;
  puntos_ganados: number;
  puntos_totales: number;
  racha_dias: number;
}

// ---------- Sesión ----------

export function guardarToken(access: string) {
  localStorage.setItem("token", access);
}
export function obtenerToken(): string | null {
  return localStorage.getItem("token");
}
export function cerrarSesion() {
  localStorage.removeItem("token");
}

// ---------- Peticiones ----------

class ErrorApi extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = obtenerToken();
  const res = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opciones.headers ?? {}),
    },
  });
  if (res.status === 401) {
    cerrarSesion();
    window.location.href = "/login";
    throw new ErrorApi(401, "Sesión expirada");
  }
  if (!res.ok) {
    let detalle = `Error ${res.status}`;
    try {
      const cuerpo = await res.json();
      if (cuerpo.detail) detalle = cuerpo.detail;
    } catch {
      /* cuerpo no era JSON */
    }
    throw new ErrorApi(res.status, detalle);
  }
  const texto = await res.text();
  return JSON.parse(texto, (_clave, valor) =>
    typeof valor === "string" ? quitarEmojis(valor) : valor
  ) as T;
}

/**
 * El backend puede traer emojis en títulos y mensajes. La interfaz usa iconos
 * propios, así que se eliminan de todo texto recibido.
 */
const EMOJI =
  /(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[\u{1F3FB}-\u{1F3FF}\u{FE0E}\u{FE0F}\u{200D}\u{20E3}])/gu;

export function quitarEmojis(texto: string): string {
  if (!EMOJI.test(texto)) return texto;
  EMOJI.lastIndex = 0;
  return texto.replace(EMOJI, "").replace(/[ \t]{2,}/g, " ").replace(/^\s+|\s+$/g, "");
}

export const api = {
  async login(username: string, password: string): Promise<void> {
    const res = await fetch(`${BASE}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new ErrorApi(res.status, "Usuario o contraseña incorrectos");
    const datos = (await res.json()) as { access: string };
    guardarToken(datos.access);
  },

  dashboard: () => pedir<DatosDashboard>("/dashboard/"),
  sistemas: () => pedir<Sistema[]>("/sistemas/"),
  indicadores: () => pedir<Indicador[]>("/indicadores/"),
  serie: (indicador: number, dias: number) =>
    pedir<Serie>(`/mediciones/?indicador=${indicador}&dias=${dias}`),
  registrarMedicion: (indicador: number, valor: number, notas = "") =>
    pedir<ResultadoMedicion>("/mediciones/", {
      method: "POST",
      body: JSON.stringify({ indicador, valor, notas }),
    }),
  tareasHoy: () => pedir<Tarea[]>("/tareas/hoy/"),
  completarTarea: (id: number) =>
    pedir<ResultadoTarea>(`/tareas/${id}/completar/`, { method: "POST" }),
  alertas: () => pedir<Alerta[]>("/alertas/?estado=abierta"),
  atenderAlerta: (id: number) =>
    pedir<{ estado: string }>(`/alertas/${id}/atender/`, { method: "POST" }),
};

// ---------- Utilidades de presentación ----------

export const COLOR_ESTADO: Record<Estado, string> = {
  verde: "#8FB8A0",
  amarillo: "#D2B07A",
  rojo: "#D98B7E",
};

export const RANGO_ESTADO: Record<Estado, number> = { verde: 0, amarillo: 1, rojo: 2 };

export const TEXTO_ESTADO: Record<Estado, string> = {
  verde: "Saludable",
  amarillo: "Vigilar",
  rojo: "Crítico",
};

export const NOMBRE_ENTORNO: Record<string, string> = {
  iss: "Órbita terrestre baja",
  luna: "Base lunar",
  marte: "Marte",
};
