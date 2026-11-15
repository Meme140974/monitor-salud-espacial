from django.urls import path

from . import views

urlpatterns = [
    path("sistemas/", views.sistemas),
    path("indicadores/", views.indicadores),
    path("mediciones/", views.mediciones),
    path("dashboard/", views.dashboard),
    path("alertas/", views.alertas),
    path("alertas/<int:pk>/atender/", views.atender_alerta),
]
