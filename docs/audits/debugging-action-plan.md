# Debugging Action Plan

## A. Availability state

- Crear una única fuente derivada `effectiveCount` para Practice y Exam.
- Al cambiar servicio, dominio o dificultad, elegir automáticamente una cantidad válida.
- Mostrar por qué un CTA está disabled; cubrir bancos de 0, 1, 2 y cantidades mayores.

## B. Session state machine

- Añadir type guard para `QuizSession` y validar `datasetVersion`, `questionIds`, `currentIndex`, `answers` y `config`.
- Ante storage inválido: limpiar solo la clave de sesión, registrar aviso no fatal y redirigir al builder.
- Separar claramente Practice feedback de Exam navigation/finalization.

## C. Exam flow

- Implementar navigator, previous/next, unanswered y marked-for-review.
- Añadir confirmación de finalización y auto-submit por timeout.
- Verificar refresh, cambio de pestaña y expiración con `expiresAt - Date.now()` como fuente de verdad.

## D. Theme and accessibility

- Definir superficies globales y controles para light/dark/system sin fallbacks que mezclen temas.
- Ejecutar Lighthouse/axe por ruta después de cada cambio.
- Añadir `main`, labels asociadas, foco visible y live regions para estados dinámicos.

## E. Icon integration

- Reutilizar exclusivamente `AwsServiceIconComponent`.
- Integrar iconos en tarjetas de servicios, filtros seleccionados, Home, Results y Review cuando representen un servicio concreto.
- Mantener dominios abstractos sin icono; resolver o documentar `amazon-quicksight`.

## F. Test coverage

- Añadir tests de componente para ambos builders y el selector de cantidades.
- Añadir tests de restore para JSON inválido, sesión incompleta y versión incompatible.
- Añadir tests de navegación de examen, auto-submit y no disclosure de respuestas.
- Añadir smoke E2E de rutas, dark mode y responsive.

## Orden recomendado

1. BUG-002 y BUG-001.
2. BUG-003 y BUG-005.
3. BUG-004, BUG-006 y BUG-007.
4. BUG-008 y pulido visual.

No se hicieron cambios de backend ni correcciones masivas durante esta auditoría.
