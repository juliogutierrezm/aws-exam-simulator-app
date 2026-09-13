# Bug Report

## BUG-001 — Builder bloqueado con bancos pequeños

- Severity: high
- Area: Practice Setup / Exam Setup
- Steps: abrir `/practice?service=amazon-inspector` o `/exam?service=amazon-inspector`; observar `1 preguntas disponibles`; no cambiar la cantidad.
- Actual: solo aparece `Todas (1)`, pero el estado conserva `count = 10`; Start queda disabled sin explicar que la cantidad seleccionada excede el banco.
- Expected: seleccionar automáticamente la única cantidad válida, hacer clamp a 1, o mostrar una validación explícita.
- Causa probable: `count` no se reajusta cuando cambia `countOptions`/`availableCount`.
- Archivos: `src/app/features/practice/practice.component.ts`, `practice.component.html`.
- Propuesta: derivar un `effectiveCount` o reajustar `count` al cambiar filtros; añadir test de servicio con 1/2 preguntas para ambos modos.

## BUG-002 — Sesión corrupta deja pantalla vacía y error Angular

- Severity: critical
- Area: Session restore / LocalStorage
- Steps: poner `aws-saa-app:v1:session` en `{}`; abrir `/practice/session`.
- Actual: pantalla sin contenido de pregunta; Console: `TypeError: Cannot read properties of undefined (reading '0')`.
- Expected: descartar la sesión inválida, limpiar la clave y redirigir a `/practice` con mensaje recuperable.
- Causa probable: `LocalProgressService.read<T>` valida JSON, pero no el esquema; `QuizSessionService.restore` acepta cualquier objeto truthy.
- Archivos: `local-progress.service.ts`, `quiz-session.service.ts`, `quiz-session.component.ts`.
- Propuesta: guard de esquema/versionado antes de restaurar; fallback seguro y aviso al usuario.

## BUG-003 — Dark mode deja fondo global claro

- Severity: high
- Area: Theming / Accessibility
- Steps: emular `prefers-color-scheme: dark` con preference `system`; abrir Practice.
- Actual: `html.dark-mode` está presente y controles/selects son oscuros, pero `body` conserva fondo claro; headings y labels blancos casi desaparecen.
- Expected: fondo, texto, cards, inputs y overlays deben pertenecer al mismo tema con contraste AA.
- Causa probable: `body` usa fallback fijo `#f9fafb` para `--p-surface-ground`, mientras el tema aplica variables distintas.
- Archivos: `src/styles.scss`, configuración PrimeNG y estilos de componentes.
- Propuesta: mapear explícitamente superficies globales para `.dark-mode` y verificar contraste en Home, Sessions, Results y Gallery.

## BUG-004 — Assets de iconos existentes no llegan a la UI principal

- Severity: medium
- Area: Icon usage / Services / Home
- Steps: abrir `/services` y Home.
- Actual: tarjetas muestran un círculo verde genérico; `AwsServiceIconComponent` solo se observa en la galería.
- Expected: usar el componente existente para tarjetas de servicio y mantener dominios abstractos sin icono.
- Causa probable: ServicesComponent y HomeComponent no importan ni renderizan `AwsServiceIconComponent`.
- Archivos: `services.component.ts`, `home.component.html`, `aws-service-icon.component.*`.
- Propuesta: integrar `icon_key → manifest → SVG` en tarjetas, filtros seleccionados y resultados donde aporta reconocimiento.

## BUG-005 — Faltan controles del flujo de examen solicitado

- Severity: high
- Area: Exam Session
- Steps: iniciar un examen; observar la sesión.
- Actual: solo se muestran pregunta, opciones, timer y Finalizar; no hay navigator, anterior/siguiente independiente, marcar para revisión ni confirmación de finalización.
- Expected: navegación libre, estado unanswered, review marks y confirmación antes de finalizar.
- Causa probable: `QuizSessionComponent` comparte una UI mínima y solo expone `next()`/`finish()`.
- Archivos: `quiz-session.component.ts/html`, `quiz-session.service.ts`.
- Propuesta: implementar la máquina de estados de examen antes de backend; mantener feedback oculto hasta Results.

## BUG-006 — Falta un landmark main en Icon Gallery

- Severity: low
- Area: Accessibility
- Steps: ejecutar Lighthouse mobile snapshot en `/icon-gallery`.
- Actual: Lighthouse reporta `landmark-one-main` fallido.
- Expected: una única región principal `main` con contenido de galería.
- Causa probable: plantilla usa banner/section sin wrapper main.
- Archivos: `icon-gallery.component.html`.
- Propuesta: envolver el contenido principal en `<main>` y mantener landmarks únicos.

## BUG-007 — Contraste insuficiente detectado en Gallery

- Severity: medium
- Area: Accessibility / UI
- Steps: ejecutar Lighthouse mobile snapshot en `/icon-gallery`.
- Actual: Lighthouse reporta `color-contrast` fallido.
- Expected: ratio WCAG AA para texto normal y labels.
- Causa probable: tokens de muted text/badges sobre superficies claras.
- Archivos: estilos de icon gallery y tokens globales.
- Propuesta: ajustar muted text, chips y metadatos; validar también dark mode.

## BUG-008 — Bundle inicial supera presupuesto

- Severity: low
- Area: Build / Performance
- Steps: ejecutar `npm run build`.
- Actual: 509.19 kB frente a 500 kB; build termina con warning.
- Expected: mantenerse dentro del presupuesto o justificar el aumento.
- Causa probable: PrimeNG/Aura y dependencias base en el chunk inicial.
- Propuesta: revisar imports globales y presupuesto después de corregir funcionalidad.

