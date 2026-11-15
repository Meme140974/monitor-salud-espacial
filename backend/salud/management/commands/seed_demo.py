"""
Carga TODO lo necesario para la demo:
  - usuario demo (astronauta / artemis2026) y admin (admin / admin)
  - misión Artemis en la Luna, día 47
  - 6 sistemas corporales, 10 indicadores con umbrales y textos en español
  - recomendaciones por indicador, tareas de rutina, línea base pre-vuelo
  - 90 días de mediciones sintéticas con una historia: el sueño y el ánimo se
    deterioran los últimos 10 días, la frecuencia cardíaca sube, los huesos
    pierden masa — así las gráficas y la figura humana cuentan algo en la demo.

Uso:  python manage.py seed_demo          (borra y recarga datos de demo)
"""
import random
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from rutinas.models import PerfilGamificacion, Tarea
from salud.models import (
    Alerta,
    Astronauta,
    Indicador,
    LineaBase,
    Medicion,
    Mision,
    Recomendacion,
    SistemaCorporal,
)
from salud.servicios import clasificar, evaluar_medicion

DIA_DE_MISION = 47
DIAS_HISTORIA = 90

SISTEMAS = [
    ("cerebro_ojos", "Cerebro y ojos", 1,
     "Controlan la percepción, la orientación y la visión.",
     "En microgravedad los fluidos suben a la cabeza y pueden aumentar la presión "
     "intracraneal y ocular (síndrome SANS). También hay desorientación y 'mareo espacial'."),
    ("corazon_vasos", "Corazón y vasos", 2,
     "Bombean sangre y distribuyen oxígeno y nutrientes.",
     "Los vasos se endurecen y envejecen más rápido; puede aparecer resistencia a la "
     "insulina y aumenta el riesgo cardiovascular."),
    ("sangre_inmune", "Sangre y sistema inmune", 3,
     "Producen células sanguíneas y defienden contra infecciones.",
     "La producción en la médula ósea se altera: menos glóbulos rojos (anemia) y menos "
     "glóbulos blancos (más infecciones y más sensibilidad a la radiación)."),
    ("musculos", "Músculos", 4,
     "Permiten el movimiento y sostienen la postura.",
     "Sin gravedad pierden masa y fuerza, los reflejos se vuelven lentos y el ejercicio "
     "es menos efectivo que en la Tierra."),
    ("huesos", "Huesos", 5,
     "Dan estructura al cuerpo y almacenan minerales.",
     "Sin soportar peso pierden densidad: hasta 1.5% de masa ósea POR MES en el espacio "
     "(un adulto >50 en la Tierra pierde ~1% por AÑO)."),
    ("mente", "Mente y descanso", 6,
     "Estado de ánimo, sueño y capacidad de concentración.",
     "El aislamiento, el confinamiento y ver 16 amaneceres al día alteran el sueño y el "
     "ánimo; la fatiga acumulada degrada el rendimiento y la salud."),
]

# clave, nombre, unidad, sistema, umbrales, linea_base, explicacion, instrucciones
INDICADORES = [
    ("presion_arterial", "Presión arterial (sistólica)", "mmHg", "corazon_vasos",
     {"verde": [90, 120], "amarillo": [[80, 90], [120, 140]], "rojo": [[0, 80], [140, 999]]},
     112,
     "Fuerza de la sangre contra las arterias. En el espacio los fluidos se redistribuyen "
     "y el corazón trabaja distinto; vigilarla detecta a tiempo problemas cardiovasculares.",
     "Coloca el brazalete en el brazo a la altura del corazón, quédate quieto 5 minutos "
     "antes y registra el número mayor (sistólica)."),
    ("frecuencia_cardiaca", "Frecuencia cardíaca en reposo", "lpm", "corazon_vasos",
     {"verde": [60, 80], "amarillo": [[50, 60], [80, 100]], "rojo": [[0, 50], [100, 999]]},
     68,
     "Latidos por minuto en reposo. Subidas sostenidas pueden indicar estrés, fatiga, "
     "deshidratación o desacondicionamiento cardiovascular.",
     "Mide al despertar, antes de moverte: sensor de pulso o dos dedos en la muñeca "
     "contando 30 segundos y multiplicando por 2."),
    ("glucosa", "Glucosa en sangre", "mg/dL", "sangre_inmune",
     {"verde": [70, 100], "amarillo": [[60, 70], [100, 126]], "rojo": [[0, 60], [126, 999]]},
     88,
     "Azúcar disponible en la sangre. El vuelo espacial puede producir resistencia a la "
     "insulina parecida a la diabetes tipo 2; conviene vigilarla en ayunas.",
     "En ayunas: lanceta en la yema del dedo, gota de sangre en la tira del glucómetro "
     "y registra el valor."),
    ("temperatura", "Temperatura corporal", "°C", "sangre_inmune",
     {"verde": [36.1, 37.2], "amarillo": [[35.5, 36.1], [37.2, 38.0]], "rojo": [[30, 35.5], [38.0, 45]]},
     36.6,
     "Con el sistema inmune debilitado, una fiebre es señal temprana de infección: en un "
     "entorno cerrado los microbios se comparten con toda la tripulación.",
     "Termómetro bajo la lengua 1 minuto (o sensor de oído). Mide siempre a la misma hora."),
    ("horas_sueno", "Horas de sueño", "h", "mente",
     {"verde": [7, 9], "amarillo": [[6, 7], [9, 10]], "rojo": [[0, 6], [10, 24]]},
     7.5,
     "El sueño repara cuerpo y mente. En órbita hay 16 amaneceres al día y el reloj "
     "biológico se desajusta; dormir poco degrada reflejos, ánimo y sistema inmune.",
     "Registra las horas dormidas (del monitor de sueño o estimadas). Cuenta solo el "
     "sueño real, no el tiempo en el saco."),
    ("animo", "Estado de ánimo", "escala 1-5", "mente",
     {"verde": [4, 5], "amarillo": [[3, 4]], "rojo": [[1, 3]]},
     4.5,
     "El aislamiento y el confinamiento pesan. Registrar el ánimo a diario permite "
     "detectar el deterioro antes de que afecte a la misión y pedir apoyo a tiempo.",
     "Elige con honestidad cómo te sientes hoy: 1 (muy mal) a 5 (muy bien). No hay "
     "respuestas incorrectas."),
    ("presion_ocular", "Presión ocular", "mmHg", "cerebro_ojos",
     {"verde": [10, 21], "amarillo": [[8, 10], [21, 25]], "rojo": [[0, 8], [25, 99]]},
     15,
     "Los fluidos que suben a la cabeza presionan el ojo y el nervio óptico (síndrome "
     "SANS): puede cambiar la forma del ojo y la visión en misiones largas.",
     "Medición en pareja con el tonómetro, como en la ISS: apoya la frente en el "
     "soporte y tu compañero acerca el sensor; 3 lecturas y registra el promedio."),
    ("radiacion", "Dosis de radiación diaria", "mSv", "sangre_inmune",
     {"verde": [0, 0.5], "amarillo": [[0.5, 1.0]], "rojo": [[1.0, 99]]},
     0.0,
     "Fuera de la atmósfera la dosis es mucho mayor (los neutrones son ~30% de la dosis "
     "en la ISS). Daña el ADN y aumenta el riesgo de cáncer y cataratas.",
     "La lee automáticamente el dosímetro personal (como el CANS canadiense). Revisa el "
     "acumulado y evita zonas poco blindadas en días de tormenta solar."),
    ("masa_osea", "Cambio de masa ósea mensual", "%/mes", "huesos",
     {"verde": [-0.5, 5], "amarillo": [[-1.5, -0.5]], "rojo": [[-99, -1.5]]},
     0.0,
     "Sin peso que soportar, el hueso se pierde hasta a 1.5% por mes. El ejercicio de "
     "resistencia diario es la contramedida principal.",
     "Se calcula con el escáner de densidad de la nave (ultrasonido del talón). Haz el "
     "escaneo semanal y registra el cambio porcentual mensual estimado."),
    ("fuerza_agarre", "Fuerza de agarre", "kg", "musculos",
     {"verde": [35, 99], "amarillo": [[30, 35]], "rojo": [[0, 30]]},
     42,
     "La fuerza de agarre es un resumen rápido del estado muscular general y se mide en "
     "segundos con un dinamómetro.",
     "Aprieta el dinamómetro con máxima fuerza 3 segundos, brazo estirado. Dos intentos "
     "por mano; registra el mejor de la mano dominante."),
]

RECOMENDACIONES = {
    "presion_arterial": (
        "Reduce el sodio de hoy, hidrátate y repite la medición en 30 min en reposo.",
        "Suspende el ejercicio, repite la medición en reposo y notifica a los cirujanos "
        "de vuelo; sigue el protocolo cardiovascular del botiquín."),
    "frecuencia_cardiaca": (
        "Haz 10 minutos de respiración guiada y evita cafeína; vuelve a medir en 1 hora.",
        "Detén la actividad física, siéntate asegurado, mide presión arterial y "
        "temperatura y contacta a tierra si no baja en 30 minutos."),
    "glucosa": (
        "Revisa tu última comida: prioriza proteína y fibra del menú; camina en la "
        "caminadora 15 min y repite la medición en 2 horas.",
        "Repite la medición para confirmar. Si sigue crítica, aplica el protocolo de "
        "glucosa del botiquín y consulta a los cirujanos de vuelo."),
    "temperatura": (
        "Hidrátate, descansa y vuelve a medir en 1 hora; vigila síntomas de infección.",
        "Aíslate del resto de la tripulación, toma el antipirético del botiquín y "
        "notifica a tierra: con el sistema inmune debilitado una fiebre es seria."),
    "horas_sueno": (
        "Esta noche: luces en modo atardecer 1 h antes, sin pantallas, sin cafeína "
        "después de medio turno. Intenta adelantar el descanso 30 min.",
        "Fatiga acumulada peligrosa: solicita al comandante reducir tu carga de tareas "
        "críticas hoy y aplica el protocolo de sueño (luz, horario fijo, siesta corta)."),
    "animo": (
        "Toma tu bloque de tiempo personal: llamada a casa, música o ventana a la "
        "Tierra. Anota en el diario qué te está pesando.",
        "Habla hoy con el médico de la tripulación y agenda videollamada con el equipo "
        "de apoyo psicológico en tierra. No es debilidad: es mantenimiento, como el "
        "ejercicio."),
    "presion_ocular": (
        "Evita esfuerzos con cabeza abajo hoy y repite la medición mañana con tu "
        "compañero.",
        "Notifica a los cirujanos de vuelo: pueden indicar lentes de presión negativa "
        "(LBNP) y un examen de fondo de ojo con la cámara retinal."),
    "radiacion": (
        "Pasa más horas de hoy en la zona blindada y revisa el pronóstico de clima "
        "espacial antes de actividades extravehiculares.",
        "Refúgiate en el compartimento blindado, pospón toda actividad extravehicular y "
        "sigue las indicaciones de tierra sobre la tormenta solar."),
    "masa_osea": (
        "Agrega hoy la rutina completa de resistencia (ARED): sentadillas y peso "
        "muerto, más calcio y vitamina D del menú.",
        "Pérdida ósea acelerada: duplica sesiones de carga axial, revisa dieta con "
        "tierra y evalúa bifosfonatos con los cirujanos de vuelo."),
    "fuerza_agarre": (
        "Suma la rutina de antebrazo y agarre de hoy y revisa tu ingesta de proteína.",
        "Pérdida muscular importante: sesión guiada de fuerza con el especialista y "
        "ajuste de dieta; reevalúa en 48 h."),
}

TAREAS = [
    ("Medir presión arterial y frecuencia cardíaca", "Al despertar, antes del desayuno.", 10, 1),
    ("Ejercicio de resistencia (ARED) 45 min", "Sentadillas y peso muerto: tu principal defensa contra la pérdida de hueso y músculo.", 20, 2),
    ("Registrar horas de sueño", "Anota cuánto dormiste realmente.", 5, 3),
    ("Encuesta de ánimo", "Un minuto de honestidad contigo mismo.", 5, 4),
    ("Chequeo de visión semanal", "Tabla de agudeza visual y presión ocular con tu compañero.", 15, 5),
    ("Hidratación: 2 L de agua", "En microgravedad la sed engaña: bebe por horario.", 5, 6),
]


class Command(BaseCommand):
    help = "Carga los datos de demo (catálogo + usuario + 90 días de historia)"

    def handle(self, *args, **options):
        random.seed(42)
        hoy = timezone.now()

        # --- limpiar datos de demo previos
        Medicion.objects.all().delete()
        Alerta.objects.all().delete()
        LineaBase.objects.all().delete()
        Recomendacion.objects.all().delete()
        Indicador.objects.all().delete()
        SistemaCorporal.objects.all().delete()
        Tarea.objects.all().delete()
        Mision.objects.all().delete()

        # --- usuarios
        user, _ = User.objects.get_or_create(username="astronauta")
        user.set_password("artemis2026")
        user.save()
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser("admin", "admin@demo.local", "admin")

        # --- misión y astronauta
        mision = Mision.objects.create(
            nombre="Artemis",
            entorno="luna",
            fecha_inicio=(hoy - timedelta(days=DIA_DE_MISION - 1)).date(),
        )
        astro, _ = Astronauta.objects.get_or_create(
            user=user, defaults={"nombre": "Ana Torres"}
        )
        astro.nombre = "Ana Torres"
        astro.mision = mision
        astro.save()
        PerfilGamificacion.objects.get_or_create(astronauta=astro)

        # --- catálogo
        sistemas = {}
        for clave, nombre, orden, desc, riesgo in SISTEMAS:
            sistemas[clave] = SistemaCorporal.objects.create(
                clave=clave, nombre=nombre, orden=orden,
                descripcion=desc, riesgo_espacial=riesgo,
            )

        indicadores = {}
        for clave, nombre, unidad, sis, umbrales, lb, expl, instr in INDICADORES:
            ind = Indicador.objects.create(
                clave=clave, nombre=nombre, unidad=unidad,
                sistema=sistemas[sis], umbrales=umbrales,
                explicacion=expl, instrucciones=instr,
            )
            indicadores[clave] = ind
            LineaBase.objects.create(astronauta=astro, indicador=ind, valor=lb)

        for clave, (rec_amarillo, rec_rojo) in RECOMENDACIONES.items():
            Recomendacion.objects.create(
                indicador=indicadores[clave], estado_objetivo="amarillo", texto=rec_amarillo)
            Recomendacion.objects.create(
                indicador=indicadores[clave], estado_objetivo="rojo", texto=rec_rojo)

        for titulo, desc, puntos, orden in TAREAS:
            Tarea.objects.create(titulo=titulo, descripcion=desc, puntos=puntos, orden=orden)

        # --- historia sintética de 90 días
        self._generar_historia(astro, indicadores, hoy)

        # --- evaluar la última medición de cada indicador -> genera alertas reales
        for ind in indicadores.values():
            ultima = (
                Medicion.objects.filter(astronauta=astro, indicador=ind)
                .order_by("-fecha").first()
            )
            if ultima:
                evaluar_medicion(ultima)

        self.stdout.write(self.style.SUCCESS(
            f"Seed listo: {Medicion.objects.count()} mediciones, "
            f"{Alerta.objects.filter(estado='abierta').count()} alertas abiertas. "
            "Usuarios: astronauta/artemis2026 y admin/admin"
        ))

    # ------------------------------------------------------------------
    def _generar_historia(self, astro, indicadores, hoy):
        """90 días de datos con narrativa: los últimos 10 días el sueño y el
        ánimo caen, la frecuencia cardíaca sube y los huesos siguen perdiendo masa."""
        n = DIAS_HISTORIA
        mediciones = []

        def agregar(clave, dia_offset, valor, cada_dias=1):
            if dia_offset % cada_dias != 0:
                return
            ind = indicadores[clave]
            valor = round(valor, 2)
            fecha = hoy - timedelta(days=n - 1 - dia_offset, hours=random.randint(0, 3))
            mediciones.append(Medicion(
                astronauta=astro, indicador=ind, valor=valor, fecha=fecha,
                fuente="sensor" if clave in ("radiacion", "frecuencia_cardiaca") else "manual",
                estado=clasificar(valor, ind.umbrales),
            ))

        for d in range(n):
            deterioro = max(0, d - (n - 10)) / 10.0  # 0 -> 1 en los últimos 10 días

            agregar("horas_sueno", d, random.gauss(7.5, 0.4) - 2.3 * deterioro)
            agregar("animo", d, min(5, max(1, random.gauss(4.4, 0.3) - 1.8 * deterioro)))
            agregar("frecuencia_cardiaca", d, random.gauss(68, 3) + 17 * deterioro)
            agregar("presion_arterial", d, random.gauss(112, 4) + 9 * deterioro)
            agregar("temperatura", d, random.gauss(36.6, 0.2))
            # glucosa estable con un pico aislado (anomalía para el ML)
            glucosa = random.gauss(88, 5) + (44 if d == n - 40 else 0)
            agregar("glucosa", d, glucosa)
            # radiación: fondo lunar + tormenta solar alrededor del día -20
            tormenta = 0.45 if abs(d - (n - 20)) <= 1 else 0
            agregar("radiacion", d, max(0.05, random.gauss(0.32, 0.06) + tormenta))
            # semanales
            agregar("presion_ocular", d, random.gauss(15, 0.8) + 3.5 * (d / n), cada_dias=3)
            agregar("masa_osea", d, random.gauss(-0.5, 0.1) - 0.7 * (d / n), cada_dias=7)
            agregar("fuerza_agarre", d, random.gauss(42, 1) - 5 * (d / n), cada_dias=7)

        Medicion.objects.bulk_create(mediciones)
