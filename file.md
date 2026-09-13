## Plan: Fase 1 AWS SAA Practice

Convertir la base Angular/PrimeNG existente en una aplicación estática completa de estudio AWS SAA, reutilizando los datos, iconos y patrones de Fase 0. La implementación se hará por capas: primero contratos y servicios puros, después sesiones y persistencia, luego shell/rutas y pantallas, y finalmente accesibilidad, responsive y validación integral.

**Pasos**

### Fase 1: contratos y datos
1. Corregir y endurecer los modelos en `src/app/core/models/`: `QuestionFeedback`, `QuestionMetadata.primary_services`, `mentioned_services`, `difficulty`, `QuestionResponse`, `QuizConfig`, `QuizSession`, `QuizResult`, `ReviewItem`, preferencias de tema y uniones `QuizMode`/`ThemePreference`. `QuizSession` debe incluir `sessionId` y `datasetVersion: "2.3"`; `QuizResult` debe incluir `resultId`, `sessionId` y `datasetVersion: "2.3"`. Mantener `data/questions.json` como fuente canónica sin modificaciones.
2. Ajustar el pipeline `scripts/sync-data.js` para generar `public/data/questions.json` como runtime optimizado, conservando únicamente los campos necesarios para la app (`id`, `exam_id`, `bank_index`, `exam_domain`, `select_count`, pregunta/opciones/respuestas generadas, `feedback`, `metadata` y `references`). Mantener sincronizados los demás catálogos y hacer que `prepare:app`, auditorías y build sigan funcionando.
3. Ampliar `DataService` o separar un `QuestionRepositoryService` para exponer preguntas, servicios y dominios cacheados, con estados de carga/error recuperables. Los filtros de servicio deben consultar exclusivamente `metadata.primary_services`.

### Fase 2: núcleo de quiz, examen y persistencia
4. Crear `QuizGeneratorService` con filtros por servicio, dominio, dificultad, examen de origen y conceptos cuando sea viable; deduplicación por ID, Fisher-Yates, selección sin repetición y validación de disponibilidad. Mantener el orden original de opciones.
5. Crear `QuizEvaluationService` para single-select, multi-select, incorrectas y no respondidas, devolviendo detalles suficientes para resaltar correctas, incorrectas seleccionadas y correctas omitidas sin mutar el dataset.
6. Crear `LocalProgressService` como único acceso a `localStorage`, con claves/versionado `aws-saa-app:v1:session`, `progress` y `settings`. Persistir sesión activa, últimos 20 resultados, errores pendientes, estadísticas agregadas y tema; almacenar IDs/respuestas/configuración, nunca copias completas de preguntas. Cada resultado debe conservar como mínimo `questionIds`, respuestas del usuario, clasificación `correct`/`incorrect`/`unanswered`, configuración, `startedAt`, `completedAt` y duración para reconstruir `/review` de forma determinista.
7. Crear `QuizSessionService` basado en Signals para el motor compartido `practice | exam`: índice actual, respuestas, navegación, selección limitada por `select_count`, marcado para revisión, finalización y restauración. Los `questionIds` se generan exactamente una vez al crear la sesión y se persisten inmediatamente; refresh, restore o navegación nunca deben regenerar las preguntas de una sesión existente. Practice evaluará antes de avanzar; exam guardará respuestas y evaluará al finalizar.
8. Crear `ExamTimerService` con `DEFAULT_FULL_EXAM_DURATION_MINUTES = 130` y `DEFAULT_MINUTES_PER_QUESTION = 2`. Persistir `startedAt`/`expiresAt`, calcular con `expiresAt - Date.now()`, restaurar tras refresh, emitir advertencias de 10/5/1 minutos y expirar con auto-submit. El examen oficial no tendrá pausa manual; los personalizados podrán desactivar timer.
9. Crear `ThemeService` con preferencias `system | light | dark`, persistencia y reacción inmediata. Integrarlo con el selector `.dark-mode` ya configurado en PrimeNG, sin colores de dark mode desperdigados por componentes.

### Fase 3: shell, navegación y features
10. Convertir `src/app/app.ts` en `AppShellComponent` o shell equivalente con header, navegación desktop/mobile, foco visible y acceso a Home, Practice, Exam, Services y tema. Mantener la galería fuera del menú principal en `/dev/icons` mediante redirección/alias compatible con `/icon-gallery` si conviene.
11. Ampliar `src/app/app.routes.ts` con lazy routes: `/`, `/practice`, `/practice/session`, `/exam`, `/exam/session`, `/results`, `/services`, `/services/:serviceId`, `/review` y `/dev/icons`; añadir guards/resolución ligera solo donde sea necesario para impedir sesiones inexistentes o redirigir a resultados tras expiración.
12. Crear componentes compartidos en `src/app/shared/components/` para `AwsServiceCard`, configuración de quiz, vista/opción de pregunta, progreso, timer, navegador de examen, feedback, resumen/resultados y toggle de tema. Reutilizar `AwsServiceIconComponent` como único resolvedor de SVG y mantener fallback de icono.
13. Crear `HomeComponent`: métricas reales de 455 preguntas, 7 exámenes, 4 dominios y servicios; CTAs de práctica/examen; continuar sesión; práctica aleatoria; dominios; servicios populares; y estadísticas locales/historial cuando existan.
14. Crear `PracticeComponent` y su builder: cantidades 5/10/20/30/50/personalizada, “todas las preguntas”, filtros opcionales y cantidades válidas por disponibilidad. Soportar `/practice?service=amazon-s3` y el flujo desde `/services/:serviceId`.
15. Crear `PracticeSessionComponent` usando el motor compartido: single/multi-select, límite de opciones, feedback con `summary`, `incorrect_options`, `key_clue` y referencias después de comprobar, bloqueo de cambios tras comprobar y avance a resultados.
16. Crear `ExamComponent` y `ExamSessionComponent`: simulación completa de 65 preguntas/130 minutos y examen personalizado de 10/20/30/50/65 con filtros y timer opcional. Incluir navegación anterior/siguiente, estado respondida/no respondida/marcada, confirmación de finalización y auto-submit; no revelar feedback, correctas ni referencias antes de resultados.
17. Crear `ResultsComponent` y `ReviewComponent`: puntuación, porcentaje, correctas/incorrectas/no respondidas, duración, resultados por dominio y por `primary_services`, revisión de errores/no respondidas opcional y CTA para repetir exactamente los IDs fallados. `/review` debe reconstruirse únicamente desde los datos persistidos del resultado y el dataset identificado por `datasetVersion`, sin volver a sortear ni regenerar la sesión. Las referencias usarán `target="_blank"` y `rel="noopener noreferrer"`.
18. Crear `ServicesComponent` y detalle de servicio: búsqueda, categoría, orden por `question_count`, grid responsive y práctica directa. Ocultar de la selección principal servicios con `question_count = 0`; conservar la galería técnica para inspección.

### Fase 4: diseño, accesibilidad y documentación
19. Consolidar tokens de spacing, superficies, foco, estados, radios, tipografía y ancho de contenido en `src/styles.scss`/SCSS del shell; personalizar el preset Aura en `src/app/app.config.ts` y cubrir desktop, tablet y 375 px sin convertir la UI en un dashboard genérico.
20. Aplicar HTML semántico, labels, `aria-selected`/`aria-checked`/live regions donde corresponda, botones reales, foco visible, estados no dependientes solo del color, navegación por teclado y `prefers-reduced-motion`. Añadir atajos solo fuera de inputs y sin interferir con accesibilidad.
21. Añadir estados de carga, error recuperable, sin preguntas suficientes, sesión inexistente, sin errores para revisar e icono faltante. Implementar confirmación de salida cuando sea apropiado, indicando que el progreso local se conserva.
22. Actualizar `README.md` con rutas, Practice/Exam, timer, random quiz, localStorage, temas, arquitectura, comandos y el límite explícito de que Fase 1 no tiene backend ni sincronización cloud.

### Fase 5: pruebas y entrega
23. Añadir specs unitarias para `QuizGeneratorService`, `QuizEvaluationService`, `ExamTimerService`, `LocalProgressService` y `ThemeService`; cubrir filtros, deduplicación, selección, evaluación single/multi/unanswered, countdown/restore/expiration, versionado y light/dark/system.
24. Añadir tests de componentes críticos para selección y comprobación en práctica, feedback, auto-submit/navegación básica y ausencia de respuestas/feedback durante Exam Mode. Conservar y no debilitar los tests existentes.
25. Ejecutar validación focal por fase y después `npm run audit:data`, `npm run audit:icons`, `npm test` y `npm run build`; inspeccionar que `data/questions.json` no cambió y registrar tamaño aproximado del build. Hacer comprobación manual de los flujos A-O solicitados, especialmente S3, single/multi-select, refresh del examen, expiración, revisión y 375/768/1024/1440 px.

**Paralelismo y dependencias**
- Los pasos 1-3 bloquean el trabajo del generador y las pantallas.
- Los pasos 4-9 pueden desarrollarse en paralelo después de fijar modelos; `QuizSessionService` depende de generación/evaluación y timer.
- Los pasos 10-18 dependen de los contratos del núcleo, pero tarjetas, shell y setup pueden avanzar en paralelo con los servicios puros.
- Los pasos 19-22 pueden hacerse en paralelo con las pantallas, con revisión final tras integrarlas.
- Los pasos 23-25 empiezan cuando cada slice esté estable; la validación final bloquea la entrega.

**Archivos relevantes**
- `src/app/core/models/*.ts` — contratos estrictos de preguntas, sesiones, resultados, progreso y tema.
- `src/app/core/services/data.service.ts` y nuevos servicios en `src/app/core/services/` — acceso a datos, generación, evaluación, sesión, timer, persistencia y tema.
- `src/app/app.ts`, `src/app/app.routes.ts`, `src/app/app.config.ts`, `src/styles.scss` — shell, rutas lazy, PrimeNG preset y tokens globales.
- `src/app/layout/` y `src/app/shared/components/` — navegación, componentes reutilizables y controles accesibles.
- `src/app/features/` — home, practice, exam, results, review y services; mantener la galería técnica aislada.
- `scripts/sync-data.js`, `package.json`, `README.md` — dataset runtime, comandos y documentación.
- `src/app/**/*.spec.ts` — cobertura nueva sin retirar tests de Fase 0.

**Verificación**
1. Auditar el contrato runtime generado y confirmar que la fuente `data/questions.json` permanece byte-for-byte sin cambios.
2. Ejecutar tests unitarios focales durante cada slice y después `npm test` completo.
3. Ejecutar `npm run audit:data`, `npm run audit:icons` y `npm run build`; anotar cualquier diagnóstico preexistente de `rootDir` y la ausencia actual de target `lint` sin convertirlos en alcance no solicitado.
4. Probar manualmente práctica aleatoria, práctica S3, single/multi-select, feedback, resultados/review, examen completo, confirmación, timer tras refresh, auto-submit, restauración, temas y responsive en los cuatro anchos.
5. Verificar que `/dev/icons` funciona y que el icono QuickSight conserva fallback, sin reauditar ni reconstruir la pipeline de SVG salvo regresión.

**Decisiones**
- La especificación de Fase 1 prevalece sobre la estructura actual; no se reconstruye Fase 0 ni se añaden backend, Cognito, usuarios, pagos, cloud sync o leaderboard.
- Se usarán Angular standalone, Signals, services y PrimeNG; no se añade NgRx.
- `metadata.primary_services` es la única relación para seleccionar preguntas por servicio; `mentioned_services` solo puede servir para información secundaria.
- Se conserva la answer key en runtime porque es una limitación aceptada de Fase 1.
- La ruta canónica visible será `/dev/icons`; se mantendrá compatibilidad con `/icon-gallery` para no romper Fase 0.
- Bookmarks pueden dejar preparado el modelo/persistencia, pero no bloquearán la entrega si elevan demasiado el alcance.

**Problemas conocidos a resolver o documentar**
1. El modelo actual no representa correctamente `feedback` ni `metadata.primary_services`; debe corregirse antes de implementar filtros.
2. El pipeline actual copia datos a `public/`; cambiarlo a runtime optimizado requiere tests del script y revisar artefactos generados.
3. `npm run lint` no tiene target configurado en `angular.json`; no se inventará un lint nuevo salvo que la implementación lo necesite.
4. Existe un fallback conocido para `amazon-quicksight`; debe permanecer como estado válido y recuperable.
