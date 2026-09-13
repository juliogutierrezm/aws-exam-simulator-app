import { DATASET_VERSION, isQuizSession, QuizSession } from './quiz.model';

const validSession: QuizSession = {
  sessionId: 's1', datasetVersion: DATASET_VERSION, mode: 'practice', questionIds: ['q1', 'q2'],
  currentIndex: 0, answers: {}, markedForReview: [],
  config: { mode: 'practice', questionCount: 2, timingMode: 'untimed' },
  startedAt: '2026-01-01T00:00:00.000Z',
};

describe('isQuizSession', () => {
  it('accepts a valid session', () => expect(isQuizSession(validSession)).toBeTrue());
  it('rejects invalid schema and empty IDs', () => {
    expect(isQuizSession({})).toBeFalse();
    expect(isQuizSession({ ...validSession, questionIds: [] })).toBeFalse();
  });
  it('rejects missing question IDs', () => expect(isQuizSession({ ...validSession, questionIds: undefined })).toBeFalse());
  it('rejects an out-of-range current index', () => expect(isQuizSession({ ...validSession, currentIndex: 2 })).toBeFalse());
  it('rejects an incompatible dataset version', () => expect(isQuizSession({ ...validSession, datasetVersion: '1.0' })).toBeFalse());
  it('rejects a countdown without duration and expiry', () => expect(isQuizSession({ ...validSession, config: { ...validSession.config, timingMode: 'countdown' } })).toBeFalse());
  it('accepts stopwatch sessions without an expiry', () => expect(isQuizSession({ ...validSession, config: { ...validSession.config, timingMode: 'stopwatch' } })).toBeTrue());
});
