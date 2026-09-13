import { TestBed } from '@angular/core/testing';
import { Question } from '../models/question.model';
import { DATASET_VERSION } from '../models/quiz.model';
import { ExamTimerService } from './exam-timer.service';
import { LocalProgressService } from './local-progress.service';
import { QuizEvaluationService } from './quiz-evaluation.service';
import { QuizGeneratorService } from './quiz-generator.service';
import { QuizSessionService } from './quiz-session.service';

const question = { id: 'q1', select_count: 1 } as Question;

describe('QuizSessionService navigation', () => {
  let service: QuizSessionService;
  const progress = {
    saveActiveSession: jasmine.createSpy(),
    getActiveSession: jasmine.createSpy().and.returnValue(null),
    clearActiveSession: jasmine.createSpy(),
  };

  beforeEach(() => {
    progress.saveActiveSession.calls.reset();
    TestBed.configureTestingModule({
      providers: [
        QuizSessionService,
        { provide: QuizGeneratorService, useValue: { generate: () => [question, { ...question, id: 'q2' }] } },
        { provide: QuizEvaluationService, useValue: { toResponse: () => ({ questionId: 'q1', selectedAnswerIds: [], classification: 'unanswered' }) } },
        { provide: LocalProgressService, useValue: progress },
        { provide: ExamTimerService, useValue: { start: () => ({ expiresAt: new Date(Date.now() + 60_000).toISOString() }), stop: jasmine.createSpy(), restore: jasmine.createSpy() } },
      ],
    });
    service = TestBed.inject(QuizSessionService);
    service.create([question, { ...question, id: 'q2' }], { mode: 'exam', questionCount: 2, timingMode: 'countdown', durationMinutes: 130 });
  });

  it('supports previous, next and jump navigation', () => {
    service.next();
    expect(service.currentIndex()).toBe(1);
    service.previous();
    expect(service.currentIndex()).toBe(0);
    service.goTo(1);
    expect(service.currentIndex()).toBe(1);
  });

  it('toggles review marks and persists them', () => {
    service.toggleMarked('q1');
    expect(service.session()?.markedForReview).toEqual(['q1']);
    service.toggleMarked('q1');
    expect(service.session()?.markedForReview).toEqual([]);
  });

  it('persists a versioned session for refresh restore', () => {
    expect(service.session()?.datasetVersion).toBe(DATASET_VERSION);
    expect(progress.saveActiveSession).toHaveBeenCalled();
  });
});
