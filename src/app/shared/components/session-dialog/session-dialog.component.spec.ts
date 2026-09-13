import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { QuizSession, QuizResult } from '../../../core/models/quiz.model';
import { Question } from '../../../core/models/question.model';
import { QuizSessionService } from '../../../core/services/quiz-session.service';
import { LocalProgressService } from '../../../core/services/local-progress.service';
import { SessionActionsService, SessionDecision } from '../../../core/services/session-actions.service';
import { SessionDialogComponent } from './session-dialog.component';

describe('Session confirmation buttons', () => {
  let fixture: ComponentFixture<SessionDialogComponent>;
  let actions: SessionActionsService;
  let quiz: QuizSessionService;
  let stored: QuizSession | null;
  let results: QuizResult[];
  const router = { navigate: jasmine.createSpy().and.resolveTo(true) };
  const questions = [{ id: 'q1', exam_id: 'saa-e03', select_count: 1, generated_correct_answers: ['A'] }] as Question[];

  beforeEach(() => {
    stored = null; results = []; router.navigate.calls.reset();
    TestBed.configureTestingModule({
      imports: [SessionDialogComponent],
      providers: [provideNoopAnimations(), { provide: Router, useValue: router },
        { provide: LocalProgressService, useValue: {
          getActiveSession: () => stored, saveActiveSession: (s: QuizSession) => stored = s,
          clearActiveSession: () => stored = null, saveResult: (r: QuizResult) => results.push(r),
        } },
      ],
    });
    quiz = TestBed.inject(QuizSessionService);
    actions = TestBed.inject(SessionActionsService);
    quiz.create(questions, { mode: 'exam', questionCount: 1, timingMode: 'untimed', examId: 'saa-e03' });
    fixture = TestBed.createComponent(SessionDialogComponent);
    fixture.autoDetectChanges();
  });
  afterEach(() => actions.choose('cancel'));

  async function click(id: SessionDecision): Promise<void> {
    await fixture.whenStable();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('[data-action="' + id + '"]');
    expect(button).withContext('Dialog button ' + id).not.toBeNull();
    button.click();
    await fixture.whenStable();
  }

  it('Continue navigates to the existing session mode without replacing it', async () => {
    const previous = JSON.stringify(stored);
    const pending = actions.beforeStart();
    await click('continue');
    expect(await pending).toBeFalse();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/exam/session']);
    expect(JSON.stringify(stored)).toBe(previous);
  });
  it('Discard and start another clears only the active session and permits creation', async () => {
    const prior = quiz.complete(questions); results = [prior];
    quiz.create(questions, { mode: 'practice', questionCount: 1, timingMode: 'untimed' });
    const pending = actions.beforeStart();
    await click('replace');
    expect(await pending).toBeTrue();
    expect(quiz.session()).toBeNull();
    expect(stored).toBeNull();
    expect(results).toEqual([prior]);
  });
  it('Save and leave preserves the complete active session', async () => {
    quiz.answer(questions[0], ['B']);
    const previous = JSON.stringify(stored);
    const pending = actions.leave();
    await click('leave');
    expect(await pending).toBeTrue();
    expect(JSON.stringify(stored)).toBe(previous);
    expect(results).toEqual([]);
  });
  it('Discard and leave removes the session without creating a result', async () => {
    const pending = actions.leave();
    await click('discard');
    expect(await pending).toBeTrue();
    expect(stored).toBeNull();
    expect(results).toEqual([]);
  });
  it('Discard confirmation removes the active session', async () => {
    const pending = actions.discard();
    await click('discard');
    expect(await pending).toBeTrue();
    expect(quiz.session()).toBeNull();
  });
  it('Finish saves one result with source metadata and navigates to Results', async () => {
    const pending = actions.finish(questions);
    await click('finish');
    await pending;
    expect(stored).toBeNull();
    expect(results.length).toBe(1);
    expect(results[0].source).toEqual({ type: 'exam', label: 'Examen 3' });
    expect(results[0].unansweredQuestionIds).toEqual(['q1']);
    expect(results[0].score).toBe(0);
    expect(results[0].total).toBe(1);
    expect(router.navigate).toHaveBeenCalledOnceWith(['/results'], { state: { result: results[0] } });
    actions.choose('finish');
    expect(results.length).toBe(1);
  });
  for (const context of ['conflict', 'leave', 'discard', 'finish'] as const) {
    it('Cancel never changes the active session in ' + context, async () => {
      quiz.answer(questions[0], ['B']);
      const previous = JSON.stringify(stored);
      const pending = context === 'conflict' ? actions.beforeStart() : context === 'finish' ? actions.finish(questions) : actions[context]();
      await click('cancel');
      await pending;
      expect(JSON.stringify(stored)).toBe(previous);
      expect(results).toEqual([]);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  }
  it('uses distinct visual styles and accessible button sizes', async () => {
    void actions.beforeStart();
    await fixture.whenStable();
    const primary = fixture.nativeElement.querySelector('[data-action="continue"]');
    const destructive = fixture.nativeElement.querySelector('[data-action="replace"]');
    expect(primary.classList.contains('primary')).toBeTrue();
    expect(destructive.classList.contains('danger-outline')).toBeTrue();
    expect(parseFloat(getComputedStyle(primary).minHeight)).toBeGreaterThanOrEqual(44);
  });
  it('does not execute a stale confirmation after expiration completed the attempt', async () => {
    const pending = actions.discard();
    quiz.complete(questions);
    actions.choose('discard');
    expect(await pending).toBeFalse();
    expect(results.length).toBe(1);
  });
  it('keeps dialog buttons separated and inside the viewport in both themes', async () => {
    void actions.beforeStart();
    await fixture.whenStable();
    const darkBefore = document.documentElement.classList.contains('dark-mode');
    try {
      for (const dark of [false, true]) {
        document.documentElement.classList.toggle('dark-mode', dark);
        const dialog: HTMLElement = fixture.nativeElement.querySelector('[role="dialog"]');
        const rect = dialog.getBoundingClientRect();
        expect(rect.width).toBeGreaterThan(200);
        expect(rect.width).toBeLessThanOrEqual(window.innerWidth);
        const buttons = [...fixture.nativeElement.querySelectorAll('[data-action]')] as HTMLButtonElement[];
        for (const button of buttons) {
          expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth + 2);
          expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
        }
        if (window.innerWidth <= 640) {
          expect(getComputedStyle(fixture.nativeElement.querySelector('.dialog-actions')).flexDirection).toBe('column');
          for (let i = 1; i < buttons.length; i++) {
            expect(buttons[i].getBoundingClientRect().top - buttons[i - 1].getBoundingClientRect().bottom).toBeGreaterThanOrEqual(10);
          }
        }
        const continueStyle = getComputedStyle(buttons[0]);
        const discardStyle = getComputedStyle(buttons[1]);
        expect(continueStyle.backgroundColor).not.toBe(discardStyle.backgroundColor);
      }
    } finally { document.documentElement.classList.toggle('dark-mode', darkBefore); }
  });
  it('Escape cancels without mutating the session and restores focus', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const before = JSON.stringify(stored);
    try {
      const pending = actions.discard();
      await fixture.whenStable();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await fixture.whenStable();
      expect(await pending).toBeFalse();
      expect(JSON.stringify(stored)).toBe(before);
      expect(document.activeElement).toBe(opener);
    } finally { opener.remove(); }
  });
});
