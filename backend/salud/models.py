"""
Modelos de salud: misión, astronauta, sistemas corporales, indicadores,
línea base, mediciones, recomendaciones y alertas.

Los umbrales de cada indicador se guardan como JSON con esta forma
(la misma que consume el frontend):
  {"verde": [60, 80], "amarillo": [[50, 60], [80, 100]], "rojo": [[0, 50], [100, 999]]}
"verde" es UN rango [min, max]; "amarillo" y "rojo" son LISTAS de rangos.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone

ESTADOS = [("verde", "Verde"), ("amarillo", "Amarillo"), ("rojo", "Rojo")]


class Mision(models.Model):
    ENTORNOS = [("iss", "ISS / órbita baja"), ("luna", "Luna"), ("marte", "Marte")]

    nombre = models.CharField(max_length=100)
    entorno = models.CharField(max_length=10, choices=ENTORNOS, default="luna")
    fecha_inicio = models.DateField()

    @property
    def dia(self) -> int:
        """Día de misión (1 = día del lanzamiento)."""
        return (timezone.now().date() - self.fecha_inicio).days + 1

    def __str__(self):
        return f"{self.nombre} ({self.get_entorno_display()})"


class Astronauta(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="astronauta"
    )
    nombre = models.CharField(max_length=120)
    mision = models.ForeignKey(
        Mision, on_delete=models.SET_NULL, null=True, related_name="tripulacion"
    )

    def __str__(self):
        return self.nombre


class SistemaCorporal(models.Model):
    """Zona clicable de la figura humana (huesos, corazón, mente...)."""

    clave = models.SlugField(unique=True)
    nombre = models.CharField(max_length=80)
    descripcion = models.TextField(help_text="Qué hace este sistema, en lenguaje sencillo")
    riesgo_espacial = models.TextField(help_text="Cómo lo afecta el vuelo espacial")
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["orden"]

    def __str__(self):
        return self.nombre


class Indicador(models.Model):
    clave = models.SlugField(unique=True)
    nombre = models.CharField(max_length=80)
    unidad = models.CharField(max_length=20)
    sistema = models.ForeignKey(
        SistemaCorporal, on_delete=models.CASCADE, related_name="indicadores"
    )
    explicacion = models.TextField(help_text="Qué es y por qué importa en el espacio")
    instrucciones = models.TextField(help_text="Cómo medirlo, paso a paso")
    umbrales = models.JSONField(help_text='{"verde": [a,b], "amarillo": [[..]], "rojo": [[..]]}')

    def __str__(self):
        return f"{self.nombre} ({self.unidad})"


class LineaBase(models.Model):
    """Valor del astronauta ANTES del vuelo. Las evaluaciones comparan contra esto."""

    astronauta = models.ForeignKey(
        Astronauta, on_delete=models.CASCADE, related_name="lineas_base"
    )
    indicador = models.ForeignKey(Indicador, on_delete=models.CASCADE)
    valor = models.FloatField()

    class Meta:
        unique_together = [("astronauta", "indicador")]

    def __str__(self):
        return f"{self.astronauta} · {self.indicador.clave} = {self.valor}"


class Medicion(models.Model):
    FUENTES = [("manual", "Manual"), ("sensor", "Sensor"), ("camara", "Cámara")]

    astronauta = models.ForeignKey(
        Astronauta, on_delete=models.CASCADE, related_name="mediciones"
    )
    indicador = models.ForeignKey(Indicador, on_delete=models.CASCADE)
    valor = models.FloatField()
    fecha = models.DateTimeField(default=timezone.now)
    fuente = models.CharField(max_length=10, choices=FUENTES, default="manual")
    notas = models.TextField(blank=True, default="")

    # Resultado de la evaluación (lo llena el motor de reglas al guardar)
    estado = models.CharField(max_length=10, choices=ESTADOS, default="verde")
    mensaje = models.CharField(max_length=200, blank=True, default="")
    anomalia = models.BooleanField(default=False)

    class Meta:
        ordering = ["fecha"]
        indexes = [models.Index(fields=["astronauta", "indicador", "fecha"])]

    def __str__(self):
        return f"{self.indicador.clave}={self.valor} [{self.estado}]"


class Recomendacion(models.Model):
    """Contramedida sugerida cuando un indicador cae en amarillo o rojo."""

    indicador = models.ForeignKey(
        Indicador, on_delete=models.CASCADE, related_name="recomendaciones"
    )
    estado_objetivo = models.CharField(max_length=10, choices=ESTADOS[1:])  # amarillo / rojo
    texto = models.TextField()

    def __str__(self):
        return f"{self.indicador.clave} [{self.estado_objetivo}]"


class Alerta(models.Model):
    NIVELES = [("amarillo", "Amarillo"), ("rojo", "Rojo")]
    ESTADOS_ALERTA = [("abierta", "Abierta"), ("atendida", "Atendida")]

    astronauta = models.ForeignKey(
        Astronauta, on_delete=models.CASCADE, related_name="alertas"
    )
    nivel = models.CharField(max_length=10, choices=NIVELES)
    titulo = models.CharField(max_length=160)
    mensaje = models.TextField()
    recomendacion = models.TextField(blank=True, default="")
    escalar_a_tierra = models.BooleanField(default=False)
    estado = models.CharField(max_length=10, choices=ESTADOS_ALERTA, default="abierta")
    creada = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creada"]

    def __str__(self):
        return f"[{self.nivel}] {self.titulo}"
