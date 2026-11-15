# Frontend — Monitor de salud para astronautas

React + TypeScript + Tailwind (Vite). Consume el contrato de API v1 del backend Django.

## Arranque

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Necesita el backend corriendo en `http://localhost:8000`
(`docker compose up` en la carpeta del backend). Credenciales demo: `astronauta` / `artemis2026`.

Si el backend vive en otra URL, crea un archivo `.env`:

```
VITE_API_URL=http://otra-maquina:8000/api
```

## Qué incluye

- **Figura humana interactiva** (`FiguraHumana.tsx`): SVG con 6 zonas clicables
  pintadas por el peor estado de sus indicadores; la mente es el anillo orbital
  alrededor de la cabeza. Secuencia de encendido al cargar; pulso solo en rojo.
- **Dashboard**: alertas abiertas (con "notificar a cirujanos de vuelo" cuando aplica),
  panel por sistema y rejilla de vitales con valor, estado con icono, tendencia y
  marca de "valor inusual" (detección de anomalías del backend).
- **Detalle de indicador**: gráfica (Recharts) con bandas de umbral verde/ámbar de
  fondo, puntos coloreados por estado, rango 7/30/90 días, explicación + instrucciones
  de medición, y formulario que registra y muestra la evaluación inmediata.
- **Rutina**: tareas del día con puntos, racha y barra de avance.
- **Login** y guardia de sesión (JWT en localStorage; 401 redirige a login).

## Diseño

Consola médica nocturna: fondo #0C1220, estados #5CC98C/#E8B44C/#E8604C siempre
acompañados de icono (nunca solo color), IBM Plex Sans + Plex Mono para lecturas.
Responsive hasta móvil, foco de teclado visible, `prefers-reduced-motion` respetado.
Iconos: lucide-react. Fuentes empaquetadas por npm — todo funciona sin internet.
