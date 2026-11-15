"""
Endpoints del contrato v1 (ver plan-equipo-hackathon.md).
Las formas JSON están congeladas con el frontend: no cambiarlas sin avisar.
"""
from datetime import timedelta

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Alerta, Astronauta, Indicador, Medicion, SistemaCorporal
from .servicios import evaluar_medicion, peor_estado, tendencia


def _astronauta(request) -> Astronauta:
    return get_object_or_404(Astronauta, user=request.user)


def _estado_actual_indicador(astronauta, indicador):
    """Última medición de un indicador (o None)."""
    return (
        Medicion.objects.filter(astronauta=astronauta, indicador=indicador)
        .order_by("-fecha")
        .first()
    )


# --- Catálogo -------------------------------------------------------------------

@api_view(["GET"])
def sistemas(request):
    astro = _astronauta(request)
    data = []
    for s in SistemaCorporal.objects.prefetch_related("indicadores"):
        estados = []
        for ind in s.indicadores.all():
            ultima = _estado_actual_indicador(astro, ind)
            if ultima:
                estados.append(ultima.estado)
        data.append(
            {
                "id": s.id,
                "clave": s.clave,
                "nombre": s.nombre,
                "descripcion": s.descripcion,
                "riesgo_espacial": s.riesgo_espacial,
                "estado": peor_estado(estados),
            }
        )
    return Response(data)


@api_view(["GET"])
def indicadores(request):
    data = [
        {
            "id": i.id,
            "clave": i.clave,
            "nombre": i.nombre,
            "unidad": i.unidad,
            "sistema": i.sistema_id,
            "explicacion": i.explicacion,
            "instrucciones": i.instrucciones,
            "umbrales": i.umbrales,
        }
        for i in Indicador.objects.select_related("sistema")
    ]
    return Response(data)


# --- Mediciones -----------------------------------------------------------------

@api_view(["GET", "POST"])
def mediciones(request):
    astro = _astronauta(request)

    if request.method == "POST":
        indicador = get_object_or_404(Indicador, pk=request.data.get("indicador"))
        try:
            valor = float(request.data.get("valor"))
        except (TypeError, ValueError):
            return Response({"detail": "valor numérico requerido"}, status=400)

        fecha = None
        if request.data.get("fecha"):
            fecha = parse_datetime(str(request.data["fecha"]))
        m = Medicion.objects.create(
            astronauta=astro,
            indicador=indicador,
            valor=valor,
            fecha=fecha or timezone.now(),
            fuente=request.data.get("fuente", "manual"),
            notas=request.data.get("notas", ""),
        )
        evaluacion = evaluar_medicion(m)
        return Response(
            {
                "id": m.id,
                "indicador": indicador.id,
                "valor": m.valor,
                "fecha": m.fecha.isoformat(),
                **evaluacion,
            },
            status=status.HTTP_201_CREATED,
        )

    # GET: serie para gráficas  /api/mediciones/?indicador=3&dias=30
    try:
        indicador = get_object_or_404(Indicador, pk=int(request.query_params["indicador"]))
    except (KeyError, ValueError):
        return Response({"detail": "parámetro indicador requerido"}, status=400)
    try:
        dias = int(request.query_params.get("dias", 30))
    except ValueError:
        dias = 30

    desde = timezone.now() - timedelta(days=dias)
    puntos = [
        {"fecha": m.fecha.isoformat(), "valor": m.valor, "estado": m.estado}
        for m in Medicion.objects.filter(
            astronauta=astro, indicador=indicador, fecha__gte=desde
        ).order_by("fecha")
    ]
    return Response(
        {
            "indicador": indicador.id,
            "unidad": indicador.unidad,
            "umbrales": indicador.umbrales,
            "puntos": puntos,
        }
    )


# --- Dashboard ------------------------------------------------------------------

@api_view(["GET"])
def dashboard(request):
    astro = _astronauta(request)
    mision = astro.mision

    tarjetas = []
    for ind in Indicador.objects.select_related("sistema"):
        qs = list(
            Medicion.objects.filter(astronauta=astro, indicador=ind)
            .order_by("-fecha")
            .values_list("valor", "estado", "anomalia")[:6]
        )
        if not qs:
            continue
        qs.reverse()  # cronológico
        valores = [v for v, _, _ in qs]
        ultimo_valor, estado, anomalia = qs[-1]
        tarjetas.append(
            {
                "id": ind.id,
                "clave": ind.clave,
                "nombre": ind.nombre,
                "ultimo_valor": ultimo_valor,
                "unidad": ind.unidad,
                "estado": estado,
                "tendencia": tendencia(valores),
                "anomalia": anomalia,
            }
        )

    alertas = [
        {
            "id": a.id,
            "nivel": a.nivel,
            "titulo": a.titulo,
            "mensaje": a.mensaje,
            "recomendacion": a.recomendacion,
            "escalar_a_tierra": a.escalar_a_tierra,
            "estado": a.estado,
        }
        for a in Alerta.objects.filter(astronauta=astro, estado="abierta")
    ]

    # gamificación (import local para evitar dependencia circular)
    from rutinas.models import PerfilGamificacion

    perfil, _ = PerfilGamificacion.objects.get_or_create(astronauta=astro)

    return Response(
        {
            "astronauta": astro.nombre,
            "mision": {
                "nombre": mision.nombre if mision else "Sin misión",
                "dia": mision.dia if mision else 0,
                "entorno": mision.entorno if mision else "iss",
            },
            "puntos": perfil.puntos,
            "racha_dias": perfil.racha_dias,
            "indicadores": tarjetas,
            "alertas": alertas,
        }
    )


# --- Alertas --------------------------------------------------------------------

@api_view(["GET"])
def alertas(request):
    astro = _astronauta(request)
    qs = Alerta.objects.filter(astronauta=astro)
    estado = request.query_params.get("estado")
    if estado:
        qs = qs.filter(estado=estado)
    return Response(
        [
            {
                "id": a.id,
                "nivel": a.nivel,
                "titulo": a.titulo,
                "mensaje": a.mensaje,
                "recomendacion": a.recomendacion,
                "escalar_a_tierra": a.escalar_a_tierra,
                "estado": a.estado,
            }
            for a in qs
        ]
    )


@api_view(["POST"])
def atender_alerta(request, pk: int):
    astro = _astronauta(request)
    alerta = get_object_or_404(Alerta, pk=pk, astronauta=astro)
    alerta.estado = "atendida"
    alerta.save(update_fields=["estado"])
    return Response({"estado": "atendida"})
