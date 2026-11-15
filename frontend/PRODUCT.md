# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user (demo persona): an astronaut on a mission (ISS, lunar base or Mars) running a daily health self-assessment from the onboard console. Real audience of this build: a hackathon jury watching a live demo; the product must read as credible and polished in that presentation.

## Product Purpose

A health monitor for astronauts. It shows the state of each body system (mind, brain/eyes, blood/immune, heart/vessels, muscles, bones) on an interactive human figure, lists vitals with status, trend and anomaly flags, records new measurements with an immediate rule-engine evaluation, raises alerts (escalating to ground flight surgeons when needed) and keeps a daily health routine with points and streaks.

## Positioning

Body-first reading of spaceflight health: every system is tied to its specific space risk (radiation, bone loss, fluid shift) and every reading is judged against clinical thresholds, with anomaly detection personal to the astronaut.

## Operating Context

Onboard console, likely in low light. Backend: Django API v1 (JWT). Demo credentials `astronauta` / `artemis2026`. Spanish (es-MX) UI.

## Capabilities and Constraints

- Routes: Login, Estado (dashboard), Indicador detalle (`/indicador/:id`), Rutina.
- Status semantics: verde (Saludable), amarillo (Vigilar), rojo (Crítico); status is never conveyed by color alone.
- Stack: React 18 + TypeScript + Tailwind 3 + Vite, lucide-react icons, Recharts, fonts bundled via npm (must work offline).
- Text coming from the backend may contain emojis; the UI must show icons, not emojis.
- Disclaimer stays: the tool supports self-assessment and does not replace flight surgeons or a doctor.

## Evidence on Hand

No real astronauts, customers, testimonials or clinical validation. Do not fabricate any.

## Product Principles

1. Clinical clarity first: a status must be readable in one glance.
2. Every number has context: unit, threshold, trend.
3. Escalation is unmistakable when ground must be notified.
4. Calm by default; urgency only when the data is red.

## Accessibility & Inclusion

Visible keyboard focus, `prefers-reduced-motion` respected, status always paired with icon and text.
