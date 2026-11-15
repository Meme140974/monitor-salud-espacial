from django.contrib import admin

from .models import (
    Alerta,
    Astronauta,
    Indicador,
    LineaBase,
    Medicion,
    Mision,
    Recomendacion,
    SistemaCorporal,
)


@admin.register(Medicion)
class MedicionAdmin(admin.ModelAdmin):
    list_display = ("indicador", "valor", "estado", "anomalia", "fecha", "astronauta")
    list_filter = ("estado", "indicador", "anomalia")


@admin.register(Indicador)
class IndicadorAdmin(admin.ModelAdmin):
    list_display = ("nombre", "clave", "unidad", "sistema")


@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = ("titulo", "nivel", "estado", "escalar_a_tierra", "creada")
    list_filter = ("nivel", "estado")


admin.site.register([Mision, Astronauta, SistemaCorporal, LineaBase, Recomendacion])
