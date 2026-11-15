from django.urls import path

from . import views

urlpatterns = [
    path("tareas/hoy/", views.tareas_hoy),
    path("tareas/<int:pk>/completar/", views.completar_tarea),
]
