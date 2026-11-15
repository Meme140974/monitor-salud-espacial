# Backend — Monitor de salud para astronautas

Django + DRF + PostgreSQL. Implementa el **contrato de API v1** de `plan-equipo-hackathon.md`.

## Arranque rápido (Docker — recomendado)

```bash
docker compose up --build
```

Eso levanta Postgres, corre migraciones, carga el seed (catálogo + 90 días de
historia) y arranca la API en `http://localhost:8000`.

## Arranque sin Docker

```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Opción A: con Postgres local (crea la BD salud_espacial / usuario astro / pass artemis2026)
python manage.py migrate
# Opción B: sin Postgres, usando SQLite (suficiente para desarrollar):
#   USE_SQLITE=1 python manage.py migrate        (Windows: set USE_SQLITE=1)

python manage.py seed_demo
python manage.py runserver
```

`seed_demo` se puede correr las veces que haga falta: borra y recarga los datos de demo.

## Credenciales

| Uso | Usuario | Contraseña |
|---|---|---|
| API / frontend | `astronauta` | `artemis2026` |
| Admin (`/admin/`) | `admin` | `admin` |

## Probar la API

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"astronauta","password":"artemis2026"}' | python -c "import sys,json;print(json.load(sys.stdin)['access'])")

curl -s http://localhost:8000/api/dashboard/ -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:8000/api/mediciones/?indicador=5&dias=30" -H "Authorization: Bearer $TOKEN"
curl -s -X POST http://localhost:8000/api/mediciones/ \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"indicador":2,"valor":105}'
```

## Qué incluye el seed

- Misión **Artemis, día 47, base lunar**; astronauta demo **Ana Torres**.
- 6 sistemas corporales (figura humana) y 10 indicadores con umbrales
  verde/amarillo/rojo, explicación e instrucciones de medición en español.
- Línea base pre-vuelo por indicador y recomendaciones para amarillo y rojo.
- 90 días de mediciones sintéticas con historia para la demo:
  - el **sueño y el ánimo caen** los últimos 10 días (genera alerta),
  - la **frecuencia cardíaca sube**,
  - pico aislado de **glucosa** (~día −40) y **tormenta solar** (~día −20),
  - pérdida gradual de **masa ósea** y **fuerza de agarre**.
- 6 tareas de rutina diaria con puntos (gamificación).

## Estructura

- `salud/` — sistemas, indicadores, mediciones, línea base, alertas, recomendaciones.
  - `servicios.py` — **motor de reglas**: clasificación por umbrales, comparación
    contra línea base, z-score robusto (anomalías), creación de alertas.
  - `management/commands/seed_demo.py` — catálogo + historia sintética.
- `rutinas/` — tareas diarias y gamificación (puntos, racha).
- `config/` — settings (Postgres por env vars, `USE_SQLITE=1` como alterno), urls.

## Endpoints (resumen)

| Método | Ruta | Qué devuelve |
|---|---|---|
| POST | `/api/auth/login/` | `{access, refresh}` |
| GET | `/api/sistemas/` | zonas de la figura humana con su estado |
| GET | `/api/indicadores/` | catálogo con umbrales e instrucciones |
| POST | `/api/mediciones/` | crea y **evalúa** (estado, mensaje, recomendación, escalar, anomalía) |
| GET | `/api/mediciones/?indicador=&dias=` | serie para gráficas |
| GET | `/api/dashboard/` | resumen completo de la pantalla principal |
| GET | `/api/tareas/hoy/` · POST `/api/tareas/{id}/completar/` | rutina + puntos |
| GET | `/api/alertas/?estado=abierta` · POST `/api/alertas/{id}/atender/` | alertas |

Nota: la app es apoyo a la decisión; **no sustituye juicio médico**.
