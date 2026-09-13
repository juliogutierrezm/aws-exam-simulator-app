import { TestBed } from '@angular/core/testing';
import { LegacyQuizResult, normalizeResult } from '../models/quiz-result';
import { LocalProgressService } from './local-progress.service';

describe('LocalProgressService', () => {
  let service: LocalProgressService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [LocalProgressService] });
    service = TestBed.inject(LocalProgressService);
  });

  it('saves and restores versioned theme settings', () => {
    service.saveTheme('dark');
    expect(service.getTheme()).toBe('dark');
  });

  it('keeps complete results for deterministic review', () => {
    const result = { resultId: 'r1', sessionId: 's1', datasetVersion: '2.3', mode: 'practice',
      questionIds: ['q1'], responses: { q1: { questionId: 'q1', selectedAnswerIds: [], classification: 'unanswered' } },
      config: { mode: 'practice', questionCount: 1, timingMode: 'untimed' }, startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:01:00.000Z', durationSeconds: 60, correct: 0, incorrect: 0, unanswered: 1 } satisfies LegacyQuizResult;
    service.saveResult(normalizeResult(result));
    expect(service.getResults()[0]).toEqual(normalizeResult(result));
    expect(service.getFailedQuestionIds()).toEqual(['q1']);
  });

  it('reads legacy history without erasing it and keeps the 20-attempt limit', () => {
    const legacy: LegacyQuizResult = {
      resultId: 'old', sessionId: 'old-session', datasetVersion: '2.3', mode: 'exam',
      config: { mode: 'exam', examId: 'saa-e03', questionCount: 1, timingMode: 'untimed' },
      questionIds: ['q'], responses: { q: { questionId: 'q', selectedAnswerIds: ['B'], classification: 'incorrect' } },
      startedAt: '2026-01-01T00:00:00Z', completedAt: '2026-01-01T00:01:00Z',
      durationSeconds: 60, correct: 0, incorrect: 1, unanswered: 0,
    };
    const raw = JSON.stringify({ results: [legacy], failedQuestionIds: ['q'] });
    localStorage.setItem('aws-saa-app:v1:progress', raw);
    const restored = service.getResults()[0];
    expect(restored.source).toEqual({ type: 'exam', label: 'Examen 3' });
    expect(restored.incorrectQuestionIds).toEqual(['q']);
    expect(localStorage.getItem('aws-saa-app:v1:progress')).toBe(raw);
    service.saveTheme('dark');
    service.saveActiveSession({ sessionId: 'new' } as import('../models/quiz.model').QuizSession);
    service.clearActiveSession();
    expect(service.getResults()[0].resultId).toBe('old');
    expect(service.getTheme()).toBe('dark');
    for (let i = 0; i < 21; i++) service.saveResult({ ...restored, resultId: 'r' + i });
    expect(service.getResults().length).toBe(20);
    expect(service.getResults()[0].resultId).toBe('r20');
    expect(service.getResults()[19].resultId).toBe('r1');
  });
});
