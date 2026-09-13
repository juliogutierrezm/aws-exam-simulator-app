import { QuizConfig, QuizResult } from '../../core/models/quiz.model';
import { describeSource, normalizeResult } from '../../core/models/quiz-result';
import { filterAttempts, reviewGroups } from './review-state';

export function attempt(resultId: string, mode: 'practice' | 'exam', examId?: string): QuizResult {
  return normalizeResult({
    resultId, sessionId: 'session-' + resultId, datasetVersion: '2.3', mode,
    config: { mode, examId, questionCount: 3, timingMode: 'untimed' },
    questionIds: ['right', 'wrong', 'empty'],
    responses: {
      right: { questionId: 'right', selectedAnswerIds: ['A'], classification: 'correct' },
      wrong: { questionId: 'wrong', selectedAnswerIds: [resultId], classification: 'incorrect' },
      empty: { questionId: 'empty', selectedAnswerIds: [], classification: 'unanswered' },
    },
    startedAt: '2026-09-13T12:00:00Z', completedAt: '2026-09-13T12:02:00Z',
    durationSeconds: 120, correct: 1, incorrect: 1, unanswered: 1,
  });
}

describe('Review by attempt', () => {
  const results = [attempt('first', 'exam', 'saa-e03'), attempt('second', 'exam', 'saa-e03'), attempt('practice', 'practice')];
  const filters = { mode: 'all' as const, examId: '', serviceId: '' };
  it('never includes correct responses, including global review', () => {
    expect(reviewGroups(results, 'all').flatMap(group => group.items).some(item => item.classification === 'correct')).toBeFalse();
    expect(reviewGroups(results, 'first', false)[0].items.map(item => item.questionId)).toEqual(['wrong']);
  });
  it('isolates different responses to the same question by resultId', () => {
    expect(reviewGroups(results, 'second')[0].items[0].selectedAnswerIds).toEqual(['second']);
    expect(reviewGroups(results, 'second').length).toBe(1);
  });
  it('Examen 3 selection only shows errors from that attempt', () => {
    const exams = filterAttempts(results, { ...filters, examId: 'saa-e03' });
    const groups = reviewGroups(exams, 'first');
    expect(groups.map(g => g.result.resultId)).toEqual(['first']);
    expect(groups[0].items.map(i => i.questionId)).toEqual(['wrong', 'empty']);
  });
  it('Practice excludes Exam', () => expect(filterAttempts(results, { ...filters, mode: 'practice' }).map(r => r.resultId)).toEqual(['practice']));
  it('Exam excludes Practice', () => expect(filterAttempts(results, { ...filters, mode: 'exam' }).map(r => r.resultId)).toEqual(['first', 'second']));
  it('filters by the practice service, not a mentioned service', () => {
    const s3 = { ...results[2], serviceId: 'amazon-s3' };
    expect(filterAttempts([...results, s3], { ...filters, serviceId: 'amazon-s3' })).toEqual([s3]);
  });
  it('does not fall back to another result when an ID is missing', () => expect(reviewGroups(results, 'missing')).toEqual([]));
  it('retains duplicate questions in global review with their respective attempts', () => {
    expect(reviewGroups(results, 'all').map(g => g.items[0].selectedAnswerIds)).toEqual([['first'], ['second'], ['practice']]);
  });
});

describe('Attempt source metadata', () => {
  const config: QuizConfig = { mode: 'practice', questionCount: 3, timingMode: 'untimed' };
  it('identifies all six supported source types', () => {
    expect(describeSource({ ...config, mode: 'exam', examId: 'saa-e03' })).toEqual({ type: 'exam', label: 'Examen 3' });
    expect(describeSource({ ...config, mode: 'exam' }).type).toBe('random-exam');
    expect(describeSource({ ...config, serviceId: 'amazon-s3' }, { service: 'Amazon S3' })).toEqual({ type: 'service-practice', label: 'Amazon S3' });
    expect(describeSource({ ...config, domainId: 'secure' }, { domain: 'Arquitecturas seguras' }).type).toBe('domain-practice');
    expect(describeSource(config).type).toBe('random-practice');
    expect(describeSource({ ...config, examId: 'saa-e03' }).type).toBe('exam-practice');
  });
});
