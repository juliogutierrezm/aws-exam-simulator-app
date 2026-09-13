# Review por intentos y confirmaciones de sesión

Fecha: 2026-09-13

## Comportamiento

- Review presenta los últimos 20 intentos locales con origen, fecha, puntuación, errores, sin responder y duración.
- Los filtros combinan modo, examen de origen y servicio de la práctica.
- El detalle usa /review?resultId=<id>. Un ID ausente no muestra otro intento.
- /review?resultId=all agrupa errores globales por intento y respeta los filtros. Una pregunta repetida conserva la respuesta de cada intento.
- Las preguntas correctas nunca se muestran en el detalle. Sin responder se puede incluir o excluir.
- Results enlaza al resultId que muestra.
- QuizResult guarda source.type/label, IDs de origen, score/total, incorrectQuestionIds/unansweredQuestionIds y los campos anteriores de sesión, respuestas y timestamps.
- Los seis tipos de origen son exam, random-exam, service-practice, domain-practice, random-practice y exam-practice.
- Los registros antiguos se normalizan al leer sin sobrescribir el almacenamiento. Los nombres antiguos de servicios/dominios se resuelven con el catálogo.

## Confirmaciones

Se usa un diálogo PrimeNG compartido con botones PrimeNG y carga diferida. Las guías Angular y accessibility-compliance orientaron el guard de navegación, las señales, los controles semánticos, el contraste y la gestión de foco.

- Conflicto: continuar (primario), descartar y comenzar otra (borde destructivo), cancelar (texto).
- Salida mediante navegación interna: cancelar, salir y conservar progreso, descartar y salir.
- Descartar: cancelar o confirmar eliminación de la sesión activa.
- Finalizar: cancelar o confirmar guardado definitivo del resultado.
- Escape y cerrar equivalen a cancelar. El foco regresa al control de origen si permanece en pantalla.
- La confirmación se vincula a la identidad de la sesión para impedir que una decisión obsoleta afecte a otra sesión.
- La cuenta regresiva no se pausa al salir; el diálogo lo indica. Las selecciones pendientes de Practice se guardan al confirmar salida conservando progreso.
- Los cambios de página internos usan CanDeactivate. Cerrar/recargar la pestaña es una operación del navegador y no presenta el diálogo PrimeNG.

## Validación

- npm test: 79/79 pruebas correctas.
- npx ng build: correcto. Advertencias: bundle inicial 538.91 kB/500 kB; estilos existentes de QuizSession 5.64 kB/4 kB.
- Chrome Headless con karma.mobile.conf.cjs: 15/15 pruebas finales de Review y diálogos correctas; comprobación de anchura, botones de al menos 44 px, ausencia de texto desbordado, disposición vertical y separación en viewport móvil; estilos claro/oscuro.
- Pruebas de clics reales en cada botón: continuar, reemplazar, conservar, descartar, finalizar y cancelar; Escape y recuperación de foco.
- Pruebas de aislamiento entre intentos del mismo examen y las mismas preguntas, exclusión de correctas, filtros Practice/Exam/servicio y compatibilidad del historial.
- No hubo navegador conectado disponible para inspección visual manual; las verificaciones de geometría e interacción se ejecutaron en Chrome Headless.

Referencia de API consultada: [PrimeNG 20 Dialog](https://v20.primeng.org/dialog).
