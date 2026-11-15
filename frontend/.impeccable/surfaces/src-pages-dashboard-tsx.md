---
version: 1
slug: "src-pages-dashboard-tsx"
primary_target: "src/pages/Dashboard.tsx"
related_targets: ["src/pages/Login.tsx","src/pages/Rutina.tsx","src/pages/IndicadorDetalle.tsx"]
---

Scope: whole app (Login, Estado, Indicador, Rutina). Mode: Operate.
Audience: astronaut doing daily self-assessment; real audience a hackathon jury.
Constraints: status never color-only; offline assets; no emojis anywhere, lucide icons only; disclaimer stays.

## Direction contract

THESIS: The body is the instrument. A real 3D human on a slow turntable replaces the flat drawing; every system is anchored to the body itself. Refuses the navy starfield console with neon glows and the 2D pictogram.
OWN-WORLD: Onboard imaging suite at cabin night-cycle. Graphite ground #0B0D10, sheet surfaces #13161B, 1px hairlines #252A32, ink #EDEFF2, Beta-cloth ivory #E8E2D4 as the one reserved accent (primary action and selection). States verde/ambar/rojo flat, always with icon + word. Geist Sans for UI, Geist Mono only for measurements. Polished ceramic mannequin, rim-lit.
STORY: The astronaut sees in one glance which system needs attention, touches it on the body, reads why it matters in space, opens the indicator, records a value.
FIRST VIEWPORT: Header with mission line, Estado/Rutina tabs, points, streak. Left 7/12: 3D stage with the figure idling, state rings on bones, system list as legend. Right 5/12: summary, open alerts, vitals table rows (name, value, unit, state, trend, history).
FORM: user-pinned in words after rejecting the decision rounds: "rediseña todo la web, quita el dibujo feo de humano y pon un ser humano en 3d con animaciones... que se vea más realista", "más premium, quita emojis y usa iconos". Roll: seed:00279f80833acc49 (two decision rounds shown, none chosen; world derived after the user pinned the 3D human).
Signature interaction: selecting a system eases the camera to that bone and dims the rest; red zones pulse; one scan-light sweep on load.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
