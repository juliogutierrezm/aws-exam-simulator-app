# Current App State — Functional Audit

Fecha de ejecución: 2026-09-10/11. Entorno: Angular 20.3, Chrome 152, `localhost:4200`, fase frontend local.

## Alcance y estado real

- La aplicación carga como SPA Angular y no requiere backend, autenticación ni red externa para sus flujos principales.
- El dataset runtime contiene 455 preguntas, 7 exámenes, 4 dominios y 75 servicios.
- Practice y Exam comparten el builder `PracticeComponent`; el modo se deriva de la ruta.
- Practice permite responder, comprobar, ver feedback/referencias y finalizar.
- Exam permite iniciar sesión cronometrada y ocultar feedback/respuestas durante la sesión.
- Results y Review leen el último resultado persistido.
- La persistencia usa `aws-saa-app:v1:session`, `aws-saa-app:v1:progress` y `aws-saa-app:v1:settings`.
- El tema `system` aplica la clase `dark-mode`; light/dark/system persisten mediante settings.
- El temporizador calcula cada actualización desde `expiresAt - Date.now()`; no depende solo de un contador decremental.
- La galería sí utiliza `AwsServiceIconComponent`; Services y Home todavía renderizan un punto verde, no el componente reutilizable.
- El manifest resuelve 64 de 65 `icon_key`; falta `amazon-quicksight`.

## Matriz de rutas

| Ruta | Estado | Bugs observados | UX / responsive | Console |
|---|---|---|---|---|
| `/` | Funcional | No se observó crash; la vista inicial no muestra progreso si no hay resultados | Hero claro; catálogo usa puntos verdes en vez de iconos AWS | Sin errores normales |
| `/practice` | Funcional con bloqueo de disponibilidad | Con bancos de 1 pregunta, el builder conserva `count=10` y deshabilita Start hasta elegir `Todas (1)` | Sin overflow a 375 px; el CTA queda debajo del primer viewport | Sin errores normales |
| `/practice/session` | Funcional con sesión activa | Sesión corrupta/incompleta produce pantalla vacía y `TypeError` | Feedback, referencias y estado bloqueado funcionan | Error reproducido con storage corrupto |
| `/exam` | Funcional con bloqueo de disponibilidad | Mismo bug de `count=10` con servicios de pocas preguntas | Timer configurado por cantidad, sin indicador adicional en builder | Sin errores normales |
| `/exam/session` | Funcional en sesión iniciada | No hay navigator, marcar para revisión ni navegación anterior visible; en una sesión de 1 pregunta solo aparece Finalizar | Timer visible; no aparece feedback antes de finalizar | Sin errores normales |
| `/results` | Funcional | Depende del último resultado local; no hay historial navegable | Resumen legible; responsive 2x2 en móvil | Sin errores normales |
| `/review` | Funcional / estado vacío | Estado vacío solo informa que no hay errores | CTA de regreso claro | Sin errores normales |
| `/services` | Funcional | No usa `AwsServiceIconComponent`; tarjetas muestran puntos verdes | Grid 3 columnas y 1 columna móvil; búsqueda funciona | Sin errores normales |
| `/dev/icons` | Redirige a `/icon-gallery` | Ninguno tras esperar navegación | Ruta técnica visible para usuarios, aunque está etiquetada como galería | Sin errores normales |
| `/icon-gallery` | Funcional | Lighthouse detecta contraste y falta de landmark main; 1 icono con fallback conocido | Galería muy densa; filtros y 75 servicios cargan | Sin errores normales |

## Flujos recorridos

- Home → Practice.
- Practice con servicio normal y servicio con 1 pregunta.
- Practice: seleccionar respuesta, comprobar, feedback, finalizar, Results.
- Review en estado sin errores.
- Exam builder normal y con servicio de 1 pregunta.
- Exam session: timer, selección de respuesta y ausencia de feedback en modo examen.
- Services: catálogo, búsqueda disponible por implementación y enlaces a Practice.
- Icon Gallery y alias `/dev/icons`.
- Tema system/light/dark; dark mode inspeccionado con emulación Chrome.
- Responsive inspeccionado a 375 px; no se observó overflow horizontal.
- LocalStorage con JSON inválido y sesión incompleta.

## Console, Network y almacenamiento

En navegación normal, Chrome DevTools mostró Console sin errores/warnings y Network sin 404/5xx. Los JSON, scripts, estilos y fuentes cargaron con 200/304; Practice cargó `questions.json`, `services.json` y `domains.json`.

El test de JSON inválido es tolerado por `LocalProgressService`, pero un objeto de sesión `{}` no se valida y rompe la sesión al leer `questionIds[0]`. La clave se conserva, por lo que la ruta puede quedar en blanco hasta limpiar el storage.

## Responsive y theming

- A 375 px el header se reorganiza correctamente y `body.scrollWidth === body.clientWidth`; no se observó overflow horizontal.
- En 375 px el CTA de inicio queda fuera del primer viewport por la altura del formulario; no es un bug funcional, pero aumenta el scroll necesario.
- En dark mode, los controles adoptan fondo oscuro pero el `body` mantiene `rgb(249,250,251)` y el texto global pasa a blanco. El resultado observado es fondo claro con texto blanco y contraste muy deficiente.

## Tests y build

- `npm test`: 27/27 exitosos. Durante los tests aparecen errores esperados de HttpClient status 0 para assets porque no hay servidor HTTP de test; no causan fallos.
- `npm run build`: exitoso, con warning: bundle inicial 509.19 kB frente a presupuesto 500 kB.
- `npm run audit:data`: PASSED, 0 errores/0 warnings.
- `npm run audit:icons`: PASSED, SVGs válidos; 302 inventariados.
- Lighthouse mobile snapshot: Accessibility 95, Best Practices 100, SEO 100, Agentic Browsing 100. Fallos: color contrast y landmark-one-main.

## ICON USAGE AUDIT

- `AwsServiceIconComponent` está importado y usado en `IconGalleryComponent`.
- `ServicesComponent` y `HomeComponent` muestran servicios sin pasar por `AwsServiceIconComponent`; el resultado observado son puntos verdes.
- `PracticeComponent` no muestra icono en el filtro seleccionado ni en el builder.
- `QuizSessionComponent` no muestra icono para `metadata.primary_services`.
- `ResultsComponent` y `ReviewComponent` no muestran iconos por servicio.
- Los iconos son apropiados para servicios concretos; no se recomienda usarlos para los cuatro dominios abstractos.
- La galería es el lugar donde la reutilización `icon_key → manifest → SVG` está verificada visualmente.
- `amazon-quicksight` permanece como fallback porque no tiene SVG resuelto.

## Cobertura frente a bugs

| Bug | Cobertura actual | Test recomendado |
|---|---|---|
| BUG-001 disponibilidad | No existe test de componente/builder | Test de filtros con 0/1/2 preguntas y clamp de cantidad |
| BUG-002 restore corrupto | `LocalProgressService` solo cubre JSON válido; no cubre esquema | Test de sesión incompleta, versión inválida y redirect seguro |
| BUG-003 dark mode | No existe test visual/DOM de tokens | Smoke por rutas con light/dark/system y contraste |
| BUG-004 iconos en UI | Tests cubren resolver/componente, no consumidores | Test de Services/Home que renderice `app-aws-service-icon` |
| BUG-005 exam flow | No existen tests de componente ni E2E | Test de navigator, review marks, unanswered, confirmación y timeout |
| BUG-006/007 accesibilidad | No existe test automatizado de rutas | Lighthouse/axe por Home, Sessions, Services, Results y Gallery |
| BUG-008 bundle | No existe assertion de presupuesto | CI que falle si el bundle inicial supera el budget |

## Límites

No se modificó backend porque no existe en esta fase. No se ejecutó un timeout real de 2 minutos ni se completó una sesión de 65 preguntas; el timer se verificó por código, UI y restauración prevista desde `expiresAt`.
