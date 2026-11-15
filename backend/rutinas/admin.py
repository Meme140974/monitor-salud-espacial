from django.contrib import admin

from .models import PerfilGamificacion, Tarea, TareaCompletada

admin.site.register([Tarea, TareaCompletada, PerfilGamificacion])
