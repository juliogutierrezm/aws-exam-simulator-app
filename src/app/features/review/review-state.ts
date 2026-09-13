import { QuizMode, QuizResult } from '../../core/models/quiz.model';

export interface ReviewFilters { mode: 'all' | QuizMode; examId: string; serviceId: string; }
export function filterAttempts(results: QuizResult[], filters: ReviewFilters): QuizResult[] {
  return results.filter(result =>
    (filters.mode === 'all' || result.mode === filters.mode) &&
    (!filters.examId || result.examId === filters.examId) &&
    (!filters.serviceId || result.serviceId === filters.serviceId));
}

export function reviewGroups(results: QuizResult[], resultId: string, includeUnanswered = true) {
  return results.filter(result => resultId === 'all' || result.resultId === resultId).map(result => ({
    result,
    items: result.questionIds.flatMap(questionId => {
      const response = result.responses[questionId] ?? { questionId, selectedAnswerIds: [], classification: 'unanswered' as const };
      return response.classification === 'incorrect' || (includeUnanswered && response.classification === 'unanswered')
        ? [{ ...response, questionId }] : [];
    }),
  }));
}
