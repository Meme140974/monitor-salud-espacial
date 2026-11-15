"""
Motor de reglas: clasifica cada medición (verde/amarillo/rojo), compara contra
la línea base personal, detecta anomalías estadísticas y genera alertas.

Principio del proyecto: las REGLAS deciden lo crítico; el ML solo apoya.
"""
from __future__ import annotations

import statistics

from .models import Alerta, LineaBase, Medicion, Recomendacion

# --- Clasificación por umbrales -------------------------------------------------

def _en_rango(valor: float, rango) -> bool:
    lo, hi = rango
    return lo <= valor <= hi


def clasificar(valor: float, umbrales: dict) -> str:
    """Devuelve 'verde' | 'amarillo' | 'rojo' según los umbrales del indicador.
    Se revisa en orden verde -> amarillo -> rojo, así un valor en la frontera
    queda en el estado más favorable. Si no cae en ningún rango: rojo.
    """
    if _en_rango(valor, umbrales["verde"]):
        return "verde"
    for rango in umbrales.get("amarillo", []):
        if _en_rango(valor, rango):
            return "amarillo"
    for rango in umbrales.get("rojo", []):
        if _en_rango(valor, rango):
            return "rojo"
    return "rojo"


# --- Anomalías (z-score robusto contra el propio historial) --------------------

MIN_HISTORIAL = 10
UMBRAL_Z = 3.5


def es_anomalia(astronauta, indicador, valor: float) -> bool:
    """z-score robusto (mediana/MAD) del valor contra el historial del propio
    astronauta. Detecta valores raros PARA ESA PERSONA aunque sigan en verde.
    """
    historial = list(
        Medicion.objects.filter(astronauta=astronauta, indicador=indicador)
        .order_by("-fecha")
        .values_list("valor", flat=True)[:90]
    )
    if len(historial) < MIN_HISTORIAL:
        return False
    mediana = statistics.median(historial)
    mad = statistics.median(abs(v - mediana) for v in historial)
    if mad == 0:
        return False
    z = 0.6745 * (valor - mediana) / mad
    return abs(z) > UMBRAL_Z


# --- Mensajes y recomendaciones -------------------------------------------------

MENSAJES = {
    "verde": "Dentro del rango saludable",
    "amarillo": "Fuera del rango óptimo: vigilar",
    "rojo": "Valor crítico",
}

DESVIO_LINEA_BASE = 0.20  # 20%


def _mensaje(astronauta, indicador, valor: float, estado: str) -> str:
    msg = MENSAJES[estado]
    lb = LineaBase.objects.filter(astronauta=astronauta, indicador=indicador).first()
    if lb and lb.valor:
        desvio = (valor - lb.valor) / abs(lb.valor)
        if abs(desvio) >= DESVIO_LINEA_BASE:
            direccion = "por encima de" if desvio > 0 else "por debajo de"
            msg += f" · {abs(desvio) * 100:.0f}% {direccion} tu línea base pre-vuelo"
    return msg


def _recomendacion(indicador, estado: str) -> str:
    if estado == "verde":
        return ""
    rec = Recomendacion.objects.filter(indicador=indicador, estado_objetivo=estado).first()
    if rec:
        return rec.texto
    # si no hay específica para rojo, usar la de amarillo como respaldo
    rec = Recomendacion.objects.filter(indicador=indicador).first()
    return rec.texto if rec else ""


# --- Alertas --------------------------------------------------------------------

RACHA_PARA_ALERTA = 3  # n mediciones seguidas fuera de verde => alerta de tendencia


def _crear_alertas(medicion: Medicion, recomendacion: str) -> None:
    astronauta, indicador = medicion.astronauta, medicion.indicador

    # 1) Valor crítico puntual -> alerta roja, escalar a tierra
    if medicion.estado == "rojo":
        titulo = f"{indicador.nombre} en nivel crítico"
        if not Alerta.objects.filter(
            astronauta=astronauta, titulo=titulo, estado="abierta"
        ).exists():
            Alerta.objects.create(
                astronauta=astronauta,
                nivel="rojo",
                titulo=titulo,
                mensaje=(
                    f"{indicador.nombre}: {medicion.valor} {indicador.unidad}. "
                    f"{medicion.mensaje}."
                ),
                recomendacion=recomendacion,
                escalar_a_tierra=True,
            )

    # 2) Tendencia sostenida -> alerta amarilla (los peligros se refuerzan con el tiempo)
    ultimas = list(
        Medicion.objects.filter(astronauta=astronauta, indicador=indicador)
        .order_by("-fecha")
        .values_list("estado", flat=True)[:RACHA_PARA_ALERTA]
    )
    if len(ultimas) == RACHA_PARA_ALERTA and all(e != "verde" for e in ultimas):
        titulo = f"{indicador.nombre} fuera de rango {RACHA_PARA_ALERTA} registros seguidos"
        if not Alerta.objects.filter(
            astronauta=astronauta, titulo=titulo, estado="abierta"
        ).exists():
            Alerta.objects.create(
                astronauta=astronauta,
                nivel="amarillo",
                titulo=titulo,
                mensaje=(
                    f"{indicador.nombre} lleva {RACHA_PARA_ALERTA} registros sin volver "
                    "al rango saludable. Revisa la recomendación y repite la medición."
                ),
                recomendacion=_recomendacion(indicador, "amarillo"),
                escalar_a_tierra=False,
            )


# --- Punto de entrada -----------------------------------------------------------

def evaluar_medicion(medicion: Medicion) -> dict:
    """Evalúa una medición recién creada: estado, mensaje, anomalía y alertas.
    Guarda el resultado en la propia medición y devuelve el dict para la API.
    """
    indicador = medicion.indicador
    estado = clasificar(medicion.valor, indicador.umbrales)
    anomalia = es_anomalia(medicion.astronauta, indicador, medicion.valor)
    mensaje = _mensaje(medicion.astronauta, indicador, medicion.valor, estado)
    recomendacion = _recomendacion(indicador, estado)

    medicion.estado = estado
    medicion.mensaje = mensaje
    medicion.anomalia = anomalia
    medicion.save(update_fields=["estado", "mensaje", "anomalia"])

    _crear_alertas(medicion, recomendacion)

    return {
        "estado": estado,
        "mensaje": mensaje,
        "recomendacion": recomendacion,
        "escalar_a_tierra": estado == "rojo",
        "anomalia": anomalia,
    }


# --- Utilidades para dashboard --------------------------------------------------

def tendencia(valores: list[float]) -> str:
    """'subiendo' | 'bajando' | 'estable' comparando el último valor
    contra el promedio de los 5 anteriores (±5%)."""
    if len(valores) < 2:
        return "estable"
    ultimo = valores[-1]
    previos = valores[-6:-1]
    prom = sum(previos) / len(previos)
    if prom == 0:
        return "estable"
    cambio = (ultimo - prom) / abs(prom)
    if cambio > 0.05:
        return "subiendo"
    if cambio < -0.05:
        return "bajando"
    return "estable"


PESO_ESTADO = {"verde": 0, "amarillo": 1, "rojo": 2}


def peor_estado(estados: list[str]) -> str:
    if not estados:
        return "verde"
    return max(estados, key=lambda e: PESO_ESTADO.get(e, 0))
