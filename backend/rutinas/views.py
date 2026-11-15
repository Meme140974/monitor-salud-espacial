from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from salud.models import Astronauta

from .models import PerfilGamificacion, Tarea, TareaCompletada


def _astronauta(request) -> Astronauta:
    return get_object_or_404(Astronauta, user=request.user)


@api_view(["GET"])
def tareas_hoy(request):
    astro = _astronauta(request)
    hoy = timezone.localdate()
    completadas = set(
        TareaCompletada.objects.filter(astronauta=astro, fecha=hoy).values_list(
            "tarea_id", flat=True
        )
    )
    return Response(
        [
            {
                "id": t.id,
                "titulo": t.titulo,
                "descripcion": t.descripcion,
                "puntos": t.puntos,
                "completada": t.id in completadas,
            }
            for t in Tarea.objects.filter(activa=True)
        ]
    )


@api_view(["POST"])
def completar_tarea(request, pk: int):
    astro = _astronauta(request)
    tarea = get_object_or_404(Tarea, pk=pk, activa=True)
    hoy = timezone.localdate()

    _, creada = TareaCompletada.objects.get_or_create(
        astronauta=astro, tarea=tarea, fecha=hoy
    )
    perfil, _ = PerfilGamificacion.objects.get_or_create(astronauta=astro)
    puntos_ganados = 0
    if creada:  # solo suma la primera vez en el día
        perfil.registrar_completada(tarea)
        puntos_ganados = tarea.puntos

    return Response(
        {
            "completada": True,
            "puntos_ganados": puntos_ganados,
            "puntos_totales": perfil.puntos,
            "racha_dias": perfil.racha_dias,
        }
    )
