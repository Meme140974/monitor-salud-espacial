# Monitor de salud para astronautas

Proyecto para el **NASA Space Apps Challenge 2026**: una herramienta visual que permite a los astronautas evaluar su propia salud durante misiones de larga duración y saber qué hacer y cuándo avisar a los cirujanos de vuelo en tierra.

## El problema

En misiones a la Luna y a Marte, los astronautas están expuestos a los cinco peligros del vuelo espacial que identifica el Programa de Investigación Humana de la NASA: radiación, aislamiento y confinamiento, distancia a la Tierra, gravedad alterada y entornos cerrados hostiles. Estos causan pérdida ósea y muscular, cambios cardiovasculares e inmunológicos, alteraciones del sueño y problemas de ánimo. Con el retraso en las comunicaciones, la tripulación tiene que detectar y atender estos cambios por sí misma.

## Qué hace

- **Figura humana interactiva.** Cada zona del cuerpo (cerebro y ojos, corazón, sangre e inmunidad, músculos, huesos y mente) se colorea según el peor estado de sus indicadores. Al tocarla, explica qué hace ese sistema y cómo lo afecta el espacio.
- **Diez indicadores de salud.** Presión arterial, frecuencia cardíaca, glucosa, temperatura, horas de sueño, estado de ánimo, presión ocular, dosis de radiación, cambio de masa ósea y fuerza de agarre.
- **Semáforo de estado.** Cada medición se clasifica en verde (saludable), amarillo (vigilar) o rojo (crítico), siempre con un icono además del color.
- **Comparación personal.** Cada valor se compara con la línea base del astronauta antes del vuelo, y un método estadístico (z-score robusto con mediana y MAD) marca los valores inusuales para esa persona aunque sigan en rango.
- **Alertas con acción.** Un valor crítico, o tres registros seguidos fuera de rango, generan una alerta con la recomendación concreta. Las críticas indican cuándo notificar a los cirujanos de vuelo en tierra.
- **Gráficas de evolución.** Cada indicador muestra su historia de 7, 30 o 90 días sobre bandas de color con los rangos saludables.
- **Explicaciones sencillas.** Cada indicador dice por qué importa en el espacio y cómo medirlo paso a paso.
- **Rutina gamificada.** Tareas diarias de salud (ejercicio de resistencia, hidratación, chequeo de visión, encuesta de ánimo) con puntos y racha de días.
- **Funciona sin internet.** Todo corre localmente, como lo haría dentro de una nave o una base lunar.

> Esta herramienta apoya la autoevaluación; no sustituye el juicio de los cirujanos de vuelo ni de un médico.

## Stack

| Capa | Tecnologías |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts, Lucide |
| Backend | Python 3.12, Django 5.2, Django REST Framework, Simple JWT |
| Base de datos | PostgreSQL 16 |
| Infraestructura | Docker y Docker Compose |

## Cómo correrlo

Requisitos: [Docker Desktop](https://www.docker.com/products/docker-desktop/) y [Node.js](https://nodejs.org/) 18 o superior.

**1. Backend** (API en `http://localhost:8000`):

```bash
cd backend
docker compose up --build
```

Esto levanta PostgreSQL, crea las tablas y carga datos de demostración: la misión Artemis en una base lunar, día 47, con 90 días de mediciones de ejemplo.

**2. Frontend** (en otra terminal, app en `http://localhost:5173`):

```bash
cd frontend
npm install
npm run dev
```

**3. Entrar:** usuario `astronauta`, contraseña `artemis2026`.

El panel de administración de Django está en `http://localhost:8000/admin/` (usuario `admin`, contraseña `admin`).

## Estructura

```
backend/
  config/     configuración de Django
  salud/      indicadores, mediciones, alertas y motor de reglas (servicios.py)
  rutinas/    tareas diarias y gamificación
frontend/
  src/components/   figura humana, tarjetas, alertas, panel de sistema
  src/pages/        estado general, detalle de indicador, rutina, inicio de sesión
  src/api.ts        cliente de la API
```

## Fuentes

- Programa de Investigación Humana de la NASA: los cinco peligros del vuelo espacial, el síndrome neuroocular (SANS) y el riesgo por pérdida de sueño y desajuste circadiano.
- Agencia Espacial Canadiense: efectos del espacio en el cuerpo humano y medición de radiación de neutrones (CANS).

Los datos de la demostración son sintéticos, generados a partir de estas fuentes (por ejemplo, pérdida ósea de hasta 1.5 % por mes).
