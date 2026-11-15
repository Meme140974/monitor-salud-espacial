"""Rutina diaria de misión y gamificación (puntos y racha)."""
from django.db import models
from django.utils import timezone

from salud.models import Astronauta


class Tarea(models.Model):
    """Tarea de la rutina diaria (medir presión, ejercicio, encuesta de ánimo...)."""

    titulo = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True, default="")
    puntos = models.PositiveSmallIntegerField(default=10)
    activa = models.BooleanField(default=True)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["orden"]

    def __str__(self):
        return self.titulo


class TareaCompletada(models.Model):
    astronauta = models.ForeignKey(
        Astronauta, on_delete=models.CASCADE, related_name="tareas_completadas"
    )
    tarea = models.ForeignKey(Tarea, on_delete=models.CASCADE)
    fecha = models.DateField(default=timezone.localdate)

    class Meta:
        unique_together = [("astronauta", "tarea", "fecha")]


class PerfilGamificacion(models.Model):
    astronauta = models.OneToOneField(
        Astronauta, on_delete=models.CASCADE, related_name="gamificacion"
    )
    puntos = models.PositiveIntegerField(default=0)
    racha_dias = models.PositiveIntegerField(default=0)
    ultima_fecha_racha = models.DateField(null=True, blank=True)

    def registrar_completada(self, tarea: Tarea) -> None:
        """Suma puntos y actualiza la racha de días consecutivos con actividad."""
        hoy = timezone.localdate()
        self.puntos += tarea.puntos
        if self.ultima_fecha_racha is None:
            self.racha_dias = 1
        elif self.ultima_fecha_racha == hoy:
            pass  # ya contaba hoy
        elif (hoy - self.ultima_fecha_racha).days == 1:
            self.racha_dias += 1
        else:
            self.racha_dias = 1
        self.ultima_fecha_racha = hoy
        self.save()

    def __str__(self):
        return f"{self.astronauta}: {self.puntos} pts, racha {self.racha_dias}"
