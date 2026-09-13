# Fase 1.2 — Stabilization Report

Fecha: 2026-09-11

## Bugs corregidos

- BUG-002: `isQuizSession` valida estructura, versión, IDs, índice, answers, config, timestamps y timer. Una sesión inválida se elimina únicamente de `aws-saa-app:v1:session` y la navegación vuelve al builder.
- BUG-001: Practice y Exam derivan cantidades válidas desde `availableCount`; bancos de 1 y 2 preguntas ya ofrecen opciones válidas y una selección obsoleta se ajusta automáticamente.
- UX Start: el botón tiene estado de inicio, evita doble click, expone `aria-disabled` y muestra errores/estados dinámicos.
- BUG-003: se añadieron tokens semánticos globales light/dark y el body ya no conserva fondo claro en dark mode.
- BUG-005: Exam incluye anterior, siguiente, navigator, salto, contador respondidas/sin responder, marcar para revisión y confirmación de finalización. El timer mantiene auto-submit y Exam no muestra feedback ni respuestas durante la sesión.
- BUG-004: Home, Services, Practice, Session, Results y Review reutilizan `AwsServiceIconComponent`.
- BUG-006: Icon Gallery tiene un único landmark `main`.
- BUG-007: se mejoraron tokens de texto muted y metadatos para contraste razonable.
- `difficulty` dejó de ser un filtro de producto: no aparece en Practice, Exam, builders, generador ni sesión; el campo del dataset se conserva.
- El timer binario fue reemplazado por `ExamTimingMode`: `untimed`, `stopwatch` y `countdown`.
- `stopwatch` deriva siempre el tiempo desde `Date.now() - startedAt`; `countdown` deriva `remaining` desde `expiresAt - Date.now()` y es el único modo que auto-finaliza.
- Exam ofrece Exam 1–7 y Random Full Exam, 65 preguntas, y los tres modos de tiempo. Results muestra siempre `Tiempo utilizado`.
- Home y builders ofrecen continuar, descartar/resetear la sesión activa con confirmación, preservando historial, resultados, estadísticas, settings y tema.

## Root causes

- Restore confiaba en que cualquier JSON parseado era una sesión válida.
- `count` era estado independiente de los filtros disponibles.
- El fondo global dependía de un fallback claro fuera del contrato de tema.
- La UI de sesión solo implementaba el camino lineal mínimo.
- Home/Services habían dejado el componente de iconos fuera de sus templates.

## Archivos modificados

- `src/app/core/models/quiz.model.ts`
- `src/app/core/services/quiz-session.service.ts`
- `src/app/features/practice/*`
- `src/app/features/quiz-session/*`
- `src/app/features/home/*`
- `src/app/features/services/services.component.ts`
- `src/app/features/results/results.component.ts`
- `src/app/features/review/review.component.ts`
- `src/app/features/icon-gallery/*`
- `src/styles.scss`
- Tests nuevos en `quiz.model.spec.ts`, `practice.component.spec.ts` y `theme.service.spec.ts`.

## Validación

- `npm run audit:data`: PASSED.
- `npm run audit:icons`: PASSED; 64/65 mappings resueltos, QuickSight queda como fallback esperado.
- `npm test`: 47/47 exitosos.
- `npm run build`: exitoso; warning de bundle inicial 509.22 kB frente a 500 kB.
- Chrome manual: Practice sin dificultad; Exam con fuentes y selector Sin límite/Cronómetro/Simulación 130 min; Results con `Tiempo utilizado`.

## Bugs restantes

- BUG-008: el bundle inicial sigue superando el presupuesto en 9.53 kB; no se hizo una optimización desproporcionada.
- No se ejecutó una expiración real de 130 minutos; el auto-submit se cubre con prueba de timer usando reloj controlado y permanece basado en `expiresAt - Date.now()`.
- La confirmación usa `window.confirm`, funcional pero pendiente de reemplazo por un diálogo accesible de aplicación si se desea mayor control UX.

**No se hicieron cambios de backend.**
