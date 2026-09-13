import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Question } from '../../core/models/question.model';
import { DataService } from '../../core/services/data.service';
import { ExamTimerService } from '../../core/services/exam-timer.service';
import { QuizSessionService } from '../../core/services/quiz-session.service';
import { QuizSessionComponent } from './quiz-session.component';
import { SessionActionsService } from '../../core/services/session-actions.service';

function question(selectCount: number): Question {
  return { id: 'question-1', select_count: selectCount, exam_domain: 'Diseño seguro', generated_question: { scenario: 'Escenario', options: ['A', 'B', 'C', 'D', 'E'].map(id => ({ id, text: `Opción ${id}` })) } } as Question;
}

describe('QuizSessionComponent answer selection', () => {
  let component: QuizSessionComponent;
  let currentQuestion: Question;
  const session = signal<any>(null);
  const currentQuestionId = signal<string | null>('question-1');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuizSessionComponent],
      providers: [
        { provide: DataService, useValue: { getQuestions: () => of([currentQuestion]), getServices: () => of([]) } },
        { provide: ActivatedRoute, useValue: { snapshot: { url: [{ path: 'practice' }] } }, },
        { provide: QuizSessionService, useValue: { session, currentQuestionId, currentIndex: signal(0), restore: () => session(), answer: jasmine.createSpy(), next: jasmine.createSpy(), previous: jasmine.createSpy(), goTo: jasmine.createSpy(), toggleMarked: jasmine.createSpy(), complete: jasmine.createSpy() } },
        { provide: ExamTimerService, useValue: { expired: signal(false), remainingSeconds: signal(0) } },
      ],
    });
  });

  function create(selectCount: number, mode: 'practice' | 'exam' = 'practice', timingMode: 'untimed' | 'stopwatch' = 'untimed'): void {
    currentQuestion = question(selectCount);
    session.set({ mode, questionIds: ['question-1'], answers: {}, config: { timingMode }, markedForReview: [] });
    component = TestBed.createComponent(QuizSessionComponent).componentInstance;
  }

  it('replaces a prior answer for single-select questions', () => {
    create(1);
    component.toggle('A');
    component.toggle('B');
    expect(component.pending()).toEqual(['B']);
    expect(component.canCheck()).toBeTrue();
  });

  it('retains two answers for a two-select question', () => {
    create(2);
    component.toggle('A');
    component.toggle('C');
    expect(component.pending()).toEqual(['A', 'C']);
    expect(component.canCheck()).toBeTrue();
  });

  it('uses immediate feedback for an untimed exam', () => {
    create(1, 'exam', 'untimed');
    component.toggle('A');

    expect(component.hasImmediateFeedback()).toBeTrue();
    expect(component.pending()).toEqual(['A']);
    expect(TestBed.inject(QuizSessionService).answer).not.toHaveBeenCalled();

    component.check();

    expect(TestBed.inject(QuizSessionService).answer).toHaveBeenCalledWith(currentQuestion, ['A']);
  });

  it('keeps timed exams in direct-answer mode without feedback', () => {
    create(1, 'exam', 'stopwatch');
    component.toggle('A');

    expect(component.hasImmediateFeedback()).toBeFalse();
    expect(component.checked()).toBeFalse();
    expect(TestBed.inject(QuizSessionService).answer).toHaveBeenCalledWith(currentQuestion, ['A']);
  });

  it('enforces the three-select limit while allowing a replacement', () => {
    create(3);
    component.toggle('A');
    component.toggle('C');
    component.toggle('E');
    expect(component.pending()).toEqual(['A', 'C', 'E']);
    component.toggle('D');
    expect(component.pending()).toEqual(['A', 'C', 'E']);
    component.toggle('C');
    component.toggle('D');
    expect(component.pending()).toEqual(['A', 'D', 'E']);
    expect(component.canCheck()).toBeTrue();
  });

  it('cancelling route departure preserves pending selections', async () => {
    create(2);
    component.toggle('A');
    const previous = JSON.stringify(session());
    spyOn(TestBed.inject(SessionActionsService), 'leave').and.resolveTo(false);
    expect(await component.canLeave()).toBeFalse();
    expect(component.pending()).toEqual(['A']);
    expect(JSON.stringify(session())).toBe(previous);
  });

  it('does not prompt on departure after the result has been saved', async () => {
    create(1);
    session.set(null);
    const leave = spyOn(TestBed.inject(SessionActionsService), 'leave').and.resolveTo(true);
    expect(await component.canLeave()).toBeTrue();
    expect(leave).not.toHaveBeenCalled();
  });
});
