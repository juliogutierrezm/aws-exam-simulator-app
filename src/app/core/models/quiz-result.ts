import { QuizConfig, QuizResult, QuizSource } from './quiz.model';

export function describeSource(config: QuizConfig, labels: { service?: string; domain?: string } = {}): QuizSource {
  const exam = config.examId ? `Examen ${Number(config.examId.replace('saa-e', ''))}` : '';
  if (config.mode === 'exam') return config.examId
    ? { type: 'exam', label: exam }
    : { type: 'random-exam', label: 'Examen aleatorio' };
  if (config.examId) return { type: 'exam-practice', label: `Práctica · ${exam}` };
  if (config.serviceId) return { type: 'service-practice', label: labels.service || config.serviceId };
  if (config.domainId) return { type: 'domain-practice', label: labels.domain || config.domainId };
  return { type: 'random-practice', label: 'Práctica aleatoria' };
}

// History predating source metadata remains readable without overwriting local storage.
export type LegacyQuizResult = Omit<QuizResult, 'source' | 'score' | 'total' | 'incorrectQuestionIds' | 'unansweredQuestionIds'> &
  Partial<Pick<QuizResult, 'source' | 'score' | 'total' | 'incorrectQuestionIds' | 'unansweredQuestionIds'>>;

export function normalizeResult(result: LegacyQuizResult): QuizResult {
  const incorrectQuestionIds = result.questionIds.filter(id => result.responses[id]?.classification === 'incorrect');
  const unansweredQuestionIds = result.questionIds.filter(id => !result.responses[id] || result.responses[id].classification === 'unanswered');
  const correct = result.questionIds.filter(id => result.responses[id]?.classification === 'correct').length;
  return {
    ...result, source: result.source ?? result.config.source ?? describeSource(result.config),
    examId: result.examId ?? result.config.examId, serviceId: result.serviceId ?? result.config.serviceId,
    domainId: result.domainId ?? result.config.domainId, incorrectQuestionIds, unansweredQuestionIds,
    score: correct, total: result.questionIds.length, correct,
    incorrect: incorrectQuestionIds.length, unanswered: unansweredQuestionIds.length,
  };
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  return `${hours ? `${hours}h ` : ''}${Math.floor(total % 3600 / 60)}m ${total % 60}s`;
}
