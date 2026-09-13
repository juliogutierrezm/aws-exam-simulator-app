# UX/UI Correction Report

## Multi-select root cause and fix

Practice mode stored clicks in a local draft while the render path was derived from persisted responses. The draft was also used as an array without the single-select replacement rule. `QuizSessionComponent` now uses a signal-backed draft as the active selection in practice mode and persists it as `QuestionResponse.selectedAnswerIds` only when the learner checks the answer.

- Single-select replaces the current id.
- Multi-select toggles ids without clearing existing ids.
- The selection cannot exceed `select_count`.
- Multi-select ids are ordered by the displayed answer order for stable persistence.
- The check CTA is enabled only when the exact required count is selected.

## Question and feedback UI

The session screen now has separated metadata, scenario, and options sections. Scenario text is constrained to `80ch`, uses a 16px to 18px clamp, and has a 1.6 line height. Options use radio or checkbox ARIA roles, are fully clickable keyboard buttons, expose `aria-checked`, and receive a visible focus outline.

Semantic `--saa-*` aliases were added for raised surfaces, secondary text, accent, and focus. Correct and incorrect options and feedback panels use distinct text labels, borders, backgrounds, and high-contrast dark-mode colors.

## Results and review

Results uses a structured four-metric summary, spaced service chips with icon and score, and separated actions. Review is now a spaced list of cards with Spanish status labels, service chips, scenario text at body scale, full learner and correct option text, explanations, and AWS references.

## Exam and session behavior

Exam setup keeps Exam 1 through Exam 7 plus an `Examen aleatorio` source, each at 65 questions. The default timing mode is now `Cronómetro`; existing `ExamTimerService` derives elapsed time from persisted `startedAt`, restores it after refresh, and permits auto-finish only for countdown sessions. The existing active-session controls continue or discard only the active session and timer, preserving progress and results.

Difficulty is not exposed as a product filter.

## Tests and build

`quiz-session.component.spec.ts` provides component-level coverage for one, two, and three selections. The three-select test covers `A`, `C`, `E`, rejected `D`, deselecting `C`, and the final ordered selection `A`, `D`, `E`.

Validated with:

```text
npx ng test --watch=false --browsers=ChromeHeadless --include='**/quiz-session.component.spec.ts'
npx ng build
```

The focused selection suite passes. The build succeeds; Angular reports the preconfigured component-style budget warning for the expanded quiz-session stylesheet.