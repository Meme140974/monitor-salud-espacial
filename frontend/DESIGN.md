---
name: Monitor de salud
description: Consola médica de a bordo; el cuerpo en 3D es el instrumento.
colors:
  fondo: "#0B0D10"
  panel: "#13161B"
  panel2: "#1A1E24"
  linea: "#252A32"
  linea2: "#323843"
  tinta: "#EDEFF2"
  tenue: "#99A0AB"
  marfil: "#E8E2D4"
  verde: "#8FB8A0"
  ambar: "#D2B07A"
  rojo: "#D98B7E"
typography:
  display:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.55
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.625
    fontFeature: "\"ss01\", \"cv11\""
  label:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.33
  cifra:
    fontFamily: "Atkinson Hyperlegible Mono, ui-monospace, monospace"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: 1.55
    fontFeature: "\"tnum\""
rounded:
  md: "6px"
  lg: "8px"
  hoja: "14px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  container: "32px"
components:
  button-primary:
    backgroundColor: "{colors.marfil}"
    textColor: "{colors.fondo}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.panel2}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.tenue}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.panel2}"
    textColor: "{colors.tinta}"
  input:
    backgroundColor: "{colors.fondo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "44px"
  hoja:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.hoja}"
    padding: "20px"
  nav-segment:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.lg}"
    padding: "4px"
  nav-segment-active:
    backgroundColor: "{colors.panel2}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  chip-inusual:
    textColor: "{colors.marfil}"
    rounded: "{rounded.md}"
    padding: "1px 6px"
---

# Design System: Monitor de salud

## Overview

**Creative North Star: "La sala de imagen en ciclo nocturno"**

Una suite de imagen médica a bordo, con la cabina en luz de noche. El suelo es grafito casi negro, las superficies son hojas apenas más claras separadas por filetes de 1px, y el único acento cálido es un marfil de tela Beta reservado para la acción principal y la selección. El centro de gravedad es una persona en 3D (piel, rostro, uniforme azul pizarra), iluminada a contraluz sobre un plato giratorio lento: cada sistema corporal se ancla a su lugar en el cuerpo, no a un dibujo plano.

La densidad es de instrumento clínico: filas compactas, cifras tabulares en Atkinson Hyperlegible Mono, estado siempre con icono más palabra. La calma es el modo por defecto; la urgencia solo aparece cuando el dato es rojo (el icono crítico pulsa, la alerta se tiñe). Se rechazó explícitamente la consola azul marino con campo de estrellas, brillos neón e IBM Plex, y el pictograma humano en 2D.

**Key Characteristics:**
- Grafito oscuro en capas tonales (fondo, hoja, hoja elevada), sin colores de marca saturados.
- Un solo acento marfil (#E8E2D4) para acción primaria, selección y luz de escena.
- Verde / ámbar / rojo planos, solo para estado, siempre acompañados de icono Phosphor y texto.
- Atkinson Hyperlegible Next para la interfaz, Atkinson Hyperlegible Mono solo para mediciones.
- El cuerpo 3D es la pieza firma; la lista de sistemas bajo él funciona como leyenda.

## Colors

Paleta de grafito frío con un único acento marfil cálido y tres colores de estado semánticos.

### Primary
- **Marfil Tela Beta** (marfil): el único acento. Fondo del botón primario, subrayado inferior del sistema seleccionado, iconos de sistema activos, etiquetas "Qué hacer:" y "En el espacio:", chip "Inusual" (al 10%), borde de input en foco (al 70%), contorno de foco global, luz de relleno de la escena 3D y halo radial bajo la figura (al 7-8%).

### Tertiary (estado)
- **Verde Saludable** (verde): estado "Saludable", barra de avance de la rutina, check de tarea completada.
- **Ámbar Vigilar** (ambar): estado "Vigilar"; también el icono de racha (Flame).
- **Rojo Crítico** (rojo): estado "Crítico", mensajes de error de formulario y de red.

### Neutral
- **Grafito de cabina** (fondo): fondo de página, fondo de inputs, texto sobre botón marfil.
- **Hoja** (panel): superficie de tarjetas, escenario 3D, segmentado de navegación.
- **Hoja elevada** (panel2): hover de filas y botones, pestaña activa, cuadros de icono, pista de la barra de avance.
- **Filete** (linea): bordes de hoja de 1px, divisores de filas, rejilla del gráfico.
- **Filete fuerte** (linea2): borde de inputs y del botón secundario, contorno interior de la pestaña activa, scrollbar.
- **Tinta** (tinta): texto principal.
- **Tinta tenue** (tenue): texto secundario, unidades, metadatos, ejes del gráfico.

### Named Rules
**The One Ivory Rule.** El marfil es el único color no semántico con croma. Marca exactamente la acción primaria o lo seleccionado; si aparece en dos botones de la misma vista, uno sobra.

**The Never Color-Only Rule.** Verde, ámbar y rojo jamás aparecen solos: cada uso lleva su icono (CircleCheck, TriangleAlert, OctagonAlert) y su palabra (Saludable, Vigilar, Crítico). Los tintes de estado se aplican como color sobre la hoja en baja opacidad (borde al 25%, fondo al 5%, cuadro de icono al 12%), nunca como relleno sólido de una superficie.

## Typography

**Display Font:** Atkinson Hyperlegible Next (con system-ui, sans-serif)
**Body Font:** Atkinson Hyperlegible Next (con system-ui, sans-serif), con `ss01` y `cv11` activos
**Label/Mono Font:** Atkinson Hyperlegible Mono (con ui-monospace), cifras tabulares

**Character:** Una grotesca técnica y neutra que deja hablar a los datos; la monoespaciada entra solo donde hay un número que medir.

### Hierarchy
- **Display** (600, 32px, 1.25, -0.02em): titular único del acceso.
- **Headline** (600, 28px, 1.25, -0.02em): h1 de cada página (Estado de…, Rutina de hoy, nombre del indicador).
- **Title** (600, 18px, -0.01em): cabecera del panel de sistema; títulos de sección a 16px/500.
- **Body** (400, 14px, 1.625): mensajes, descripciones, filas; párrafos largos limitados a 65ch.
- **Label** (500, 12px): palabra de estado, tendencia, metadatos; el chip "Inusual" baja a 11px.
- **Cifra** (Atkinson Hyperlegible Mono 500, 18px, tabular): valores de indicadores, puntos, racha; la unidad va al lado en 12px tenue.

### Named Rules
**The Mono-Means-Measure Rule.** Atkinson Hyperlegible Mono se usa solo para valores medidos, puntos, contadores y credenciales de demo. Nunca para etiquetas, títulos ni navegación.

**The Sentence-Case Rule.** Todo el texto va en minúsculas de oración; no hay mayúsculas con tracking ni rótulos sobre los titulares.

## Layout

Contenedor centrado de 1320px máximo con 32px de margen lateral en escritorio (20px en móvil para el contenido, 16px en la cabecera). La cabecera es fija, de 64px, con fondo grafito al 85% y desenfoque. El tablero usa una rejilla de 12 columnas: 7 para el escenario 3D (pegajoso a 96px del borde superior) y 5 para alertas, panel de sistema e indicadores; bajo 1024px todo se apila y el panel de sistema se desplaza a la vista al elegir una zona. Rutina se centra en una columna estrecha (unos 768px). El acceso divide la pantalla en credenciales a la izquierda y el cuerpo 3D a la derecha (1fr / 1.25fr), y oculta la figura bajo 1024px.

Ritmo: 24px entre bloques mayores, 20px de relleno interno de hoja (16px en móvil), filas de 14px verticales. Los controles miden 32px (pestañas), 36px (botones secundarios) y 44px (inputs y botón primario).

## Elevation & Depth

Sistema plano por capas tonales: la profundidad se lee por el paso de fondo a hoja a hoja elevada y por filetes de 1px, no por sombras. La única sombra es la de la hoja flotante (panel de sistema), un brillo superior de 1px y una caída difusa muy oscura. La profundidad real vive en la escena 3D: luz clave cálida, contraluces frío y marfil, sombra de contacto bajo los pies y un halo radial marfil muy tenue en el suelo del escenario.

### Shadow Vocabulary
- **Hoja** (`box-shadow: 0 1px 0 rgba(255,255,255,0.03) inset, 0 18px 40px -24px rgba(0,0,0,0.8)`): solo para hojas que aparecen sobre el flujo (panel de sistema).
- **Contorno activo** (`box-shadow: inset 0 0 0 1px #323843`): pestaña activa de la navegación segmentada.
- **Subrayado de selección** (`box-shadow: inset 0 -2px 0 #E8E2D4`): sistema seleccionado en la leyenda bajo la figura.

### Named Rules
**The Tonal-First Rule.** Para separar, primero sube un paso de superficie o añade un filete de 1px; la sombra de hoja queda para lo que se superpone de verdad.

## Shapes

Esquinas suaves y consistentes: hojas a 14px, cuadros de icono a 8px, botones, inputs, chips y pestañas a 6px, y círculos completos solo para la barra de avance y las casillas de tarea. Los bordes son siempre de 1px (filete o filete fuerte). El contorno de foco es de 2px marfil con 2px de separación y radio de 6px. Las leyendas en rejilla usan `gap: 1px` sobre fondo filete para dibujar divisores sin bordes dobles.

## Components

### Buttons
Discretos y táctiles; el marfil sólido es raro a propósito.
- **Shape:** ligeramente redondeado (6px).
- **Primary:** fondo marfil, texto grafito, 14px/500, 44px de alto en formularios (40px en el estado de error). Hover baja la opacidad al 90%; deshabilitado al 35%.
- **Secondary:** transparente con borde filete fuerte (o filete en "Actualizar"), texto tinta o tenue, 36px. Hover pasa a hoja elevada y aclara el borde.
- **Ghost:** solo icono o icono más texto, tenue; hover hoja elevada y tinta (Salir, cerrar panel, mostrar contraseña).
- Todo botón lleva icono Phosphor de 14-16px a la izquierda del texto.

### Chips
- **Inusual:** marfil al 10% de fondo, texto marfil 11px/500, icono ScanSearch de 12px, radio 6px. Marca anomalías personales, nunca estado.

### Cards / Containers
- **Corner Style:** 14px (hoja).
- **Background:** hoja (#13161B) sobre grafito.
- **Shadow Strategy:** ninguna en reposo; sombra de hoja solo en el panel de sistema.
- **Border:** 1px filete.
- **Internal Padding:** 20px (16px en móvil); las listas internas van a sangre con divisores filete.

### Inputs / Fields
- **Style:** fondo grafito (más oscuro que la hoja), borde 1px filete fuerte, radio 6px, 44px, texto 15px; los valores numéricos usan Atkinson Hyperlegible Mono.
- **Focus:** el borde pasa a marfil al 70%, sin anillo extra.
- **Error:** mensaje en rojo bajo el campo con `role="alert"`, redactado como causa y siguiente paso.

### Navigation
- Control segmentado en la cabecera: contenedor hoja con borde filete, radio 8px, 4px de relleno. Cada pestaña 32px, icono 15px y palabra; activa en hoja elevada con contorno interior filete fuerte y texto tinta; inactiva en tenue. A la derecha, puntos (estrella marfil) y racha (llama ámbar) en cifra mono, ocultos bajo 768px.

### Alerta
Hoja teñida por su estado: borde del color al 25%, fondo del color al 5% sobre la hoja, cuadro de icono de 36px al 12%. Título, palabra de estado, mensaje tenue, "Qué hacer:" en marfil. Si escala a tierra, una pastilla con el icono Satellite y el texto en el color de estado. El icono crítico pulsa (1.6s). Al marcarse atendida sale deslizando 12px a la derecha en 0.35s.

### Fila vital
Fila enlazada: icono de estado 16px, nombre, línea de estado + tendencia (+ chip Inusual), historial en polilínea gris (#454C59) con el último punto en color de estado, valor en cifra 18px que cuenta hasta su valor en 0.8s, unidad 12px tenue y chevron que se desplaza 2px en hover.

### Cuerpo 3D (signature)
Cuerpo anatómico en 3D (`Cuerpo3D.tsx`): silueta de rayos X (X Bot de Mixamo en `public/models/silueta.glb`, material translúcido con borde luminoso #B9CBE4 por Fresnel) que deja ver por capas el esqueleto (hueso #E4DCCB, cráneo translúcido), los órganos (cerebro #C7A3A0, corazón #B4554C, pulmones #C99490 al 82%, hígado, estómago, intestinos, riñones) y la circulación (arterias #B8564D, venas #4F6F9C). Toda la anatomía es geometría procedural anclada a los huesos, así que sigue la animación de reposo; los pulmones respiran (4.2s) y el corazón late más rápido si su estado empeora. Un panel de capas (Piel, Esqueleto, Órganos, Circulación) en la esquina superior derecha enciende o apaga cada capa. Elegir un sistema ilumina su grupo con el color de su estado, atenúa el resto al 30%, acerca la cámara sin recortar y la figura asiente. Los marcadores son botones redondos de 28px con el icono de estado en relleno. Una línea de luz recorre el cuerpo al cargar. Es ilustrativo, no un modelo médico.

### Movimiento
Curva de salida `cubic-bezier(0.16, 1, 0.3, 1)` para todo lo que entra: subir 8px en 0.5s escalonado (60ms en alertas, 35ms en filas), aparecer desde desenfoque en 0.9s para la escena del acceso, barra de avance en 0.7s. Todo se anula con `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** emparejar cada color de estado con su icono Phosphor y su palabra (Saludable, Vigilar, Crítico).
- **Do** reservar el marfil (#E8E2D4) para la acción primaria, la selección y la luz de escena.
- **Do** escribir toda medición en Atkinson Hyperlegible Mono tabular con la unidad al lado en 12px tenue.
- **Do** separar superficies por paso tonal y filete de 1px antes que por sombra.
- **Do** usar solo iconos Phosphor; los emojis que lleguen del backend se sustituyen por iconos (iconos.ts).
- **Do** mantener el aviso de que la herramienta no sustituye a los cirujanos de vuelo en el pie de cada vista.

### Don't:
- **Don't** volver a la consola azul marino con campo de estrellas, brillos neón o IBM Plex.
- **Don't** dibujar el cuerpo como pictograma 2D; el cuerpo es el modelo 3D.
- **Don't** rellenar superficies con verde, ámbar o rojo sólido; el estado tiñe a baja opacidad.
- **Don't** usar mayúsculas con tracking ni rótulos encima de los titulares.
- **Don't** animar en bucle la interfaz plana; los bucles quedan para el cuerpo (reposo y giro lento), el halo del punto crítico o seleccionado y el pulso del icono crítico.
