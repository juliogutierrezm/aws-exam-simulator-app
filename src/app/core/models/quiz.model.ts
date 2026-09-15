export type QuizMode = 'practice' | 'exam';
export type ExamTimingMode = 'untimed' | 'stopwatch' | 'countdown';
export type AnswerClassification = 'correct' | 'incorrect' | 'unanswered';
export type ThemePreference = 'light' | 'dark';
export type QuizSourceType = 'exam' | 'random-exam' | 'service-practice' | 'domain-practice' | 'random-practice' | 'exam-practice';
export type SelectCountFilter = 1 | 2 | 3;
export interface QuizSource { type: QuizSourceType; label: string; }

export const DATASET_VERSION = '2.3' as const;

export interface QuizConfig {
  mode: QuizMode;
  questionCount: number;
  serviceId?: string;
  domainId?: string;
  examId?: string;
  conceptId?: string;
  selectCount?: SelectCountFilter | null;
  source?: QuizSource;
  timingMode: ExamTimingMode;
  durationMinutes?: number;
}

export interface QuestionResponse {
  questionId: string;
  selectedAnswerIds: string[];
  classification: AnswerClassification;
}

export interface QuizSession {
  sessionId: string;
  datasetVersion: typeof DATASET_VERSION;
  mode: QuizMode;
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, QuestionResponse>;
  markedForReview: string[];
  config: QuizConfig;
  startedAt: string;
  expiresAt?: string;
  completedAt?: string;
  pendingAnswers?: Record<string, string[]>;
}

export interface QuizResult {
  source: QuizSource;
  examId?: string;
  serviceId?: string;
  domainId?: string;
  incorrectQuestionIds: string[];
  unansweredQuestionIds: string[];
  score: number;
  total: number;
  resultId: string;
  sessionId: string;
  datasetVersion: typeof DATASET_VERSION;
  mode: QuizMode;
  questionIds: string[];
  responses: Record<string, QuestionResponse>;
  config: QuizConfig;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  correct: number;
  incorrect: number;
  unanswered: number;
}

export interface ReviewItem {
  questionId: string;
  response: QuestionResponse;
}

export function isQuizSession(value: unknown): value is QuizSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<QuizSession>;
  const config = session.config as Partial<QuizConfig> | undefined;
  const questionIds = session.questionIds;
  const currentIndex = session.currentIndex;
  const questionCount = config?.questionCount;

  if (
    typeof session.sessionId !== 'string' ||
    session.datasetVersion !== DATASET_VERSION ||
    (session.mode !== 'practice' && session.mode !== 'exam') ||
    !Array.isArray(questionIds) ||
    questionIds.length === 0 ||
    !questionIds.every(id => typeof id === 'string' && id.length > 0) ||
    !Number.isInteger(currentIndex) ||
    currentIndex! < 0 ||
    currentIndex! >= questionIds.length ||
    !session.answers ||
    typeof session.answers !== 'object' ||
    !config ||
    config.mode !== session.mode ||
    !Number.isInteger(questionCount) ||
    questionCount! <= 0 ||
    (config.timingMode !== 'untimed' && config.timingMode !== 'stopwatch' && config.timingMode !== 'countdown') ||
    typeof session.startedAt !== 'string' ||
    Number.isNaN(Date.parse(session.startedAt))
  ) {
    return false;
  }

  if (config.timingMode === 'countdown' && (!Number.isFinite(config.durationMinutes) || config.durationMinutes! <= 0)) {
    return false;
  }

  if (config.timingMode === 'countdown') {
    return typeof session.expiresAt === 'string' && !Number.isNaN(Date.parse(session.expiresAt));
  }

  return !session.expiresAt;
}
