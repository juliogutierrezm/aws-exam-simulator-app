import { Injectable, computed, inject, signal } from '@angular/core';
import { Question } from '../models/question.model';
import { normalizeResult } from '../models/quiz-result';
import {
  DATASET_VERSION,
  QuizConfig,
  QuizResult,
  QuizSession,
  QuestionResponse,
  isQuizSession,
} from '../models/quiz.model';
import { ExamTimerService } from './exam-timer.service';
import { LocalProgressService } from './local-progress.service';
import { QuizEvaluationService } from './quiz-evaluation.service';
import { QuizGeneratorService } from './quiz-generator.service';

@Injectable({ providedIn: 'root' })
export class QuizSessionService {
  private readonly generator = inject(QuizGeneratorService);
  private readonly evaluation = inject(QuizEvaluationService);
  private readonly progress = inject(LocalProgressService);
  private readonly timer = inject(ExamTimerService);

  private readonly sessionState = signal<QuizSession | null>(null);
  readonly session = this.sessionState.asReadonly();
  readonly currentIndex = computed(() => this.sessionState()?.currentIndex ?? 0);
  readonly currentQuestionId = computed(() => this.sessionState()?.questionIds[this.currentIndex()] ?? null);

  create(questions: Question[], config: QuizConfig): QuizSession {
    if (this.sessionState() || this.progress.getActiveSession()) {
      throw new Error('An active quiz session already exists');
    }

    const selectedQuestions = this.generator.generate(questions, config);
    const startedAt = new Date().toISOString();
    const session: QuizSession = {
      sessionId: this.createId(),
      datasetVersion: DATASET_VERSION,
      mode: config.mode,
      questionIds: selectedQuestions.map((question) => question.id),
      currentIndex: 0,
      answers: {},
      markedForReview: [],
      config,
      startedAt,
    };

    const timerState = this.timer.start(config.timingMode, new Date(startedAt), config.durationMinutes);
    if (timerState.expiresAt) {
      session.expiresAt = timerState.expiresAt;
    }

    this.sessionState.set(session);
    this.progress.saveActiveSession(session);
    return session;
  }

  restore(): QuizSession | null {
    const session = this.progress.getActiveSession();
    if (!session || !isQuizSession(session)) {
      if (session) this.progress.clearActiveSession();
      return null;
    }

    this.sessionState.set(session);
    this.timer.restore(session.config.timingMode, session.startedAt, session.expiresAt);
    return session;
  }

  answer(question: Question, selectedAnswerIds: string[]): QuestionResponse {
    const session = this.requireSession();
    const selected = [...new Set(selectedAnswerIds)].slice(0, question.select_count);
    const response = this.evaluation.toResponse(question, selected);
    const updated: QuizSession = {
      ...session,
      answers: { ...session.answers, [question.id]: response },
    };
    this.commit(updated);
    return response;
  }

  goTo(index: number): void {
    const session = this.requireSession();
    if (index < 0 || index >= session.questionIds.length) {
      return;
    }
    this.commit({ ...session, currentIndex: index });
  }

  next(): void {
    this.goTo(this.currentIndex() + 1);
  }

  previous(): void {
    this.goTo(this.currentIndex() - 1);
  }

  toggleMarked(questionId: string): void {
    const session = this.requireSession();
    const marked = new Set(session.markedForReview);
    if (marked.has(questionId)) {
      marked.delete(questionId);
    } else {
      marked.add(questionId);
    }
    this.commit({ ...session, markedForReview: [...marked] });
  }

  complete(questions: Question[], completedAt = new Date()): QuizResult {
    const session = this.requireSession();
    const responses = { ...session.answers };
    const questionById = new Map(questions.map((question) => [question.id, question]));
    for (const questionId of session.questionIds) {
      if (!responses[questionId]) {
        responses[questionId] = {
          questionId,
          selectedAnswerIds: [],
          classification: 'unanswered',
        };
      }
      const question = questionById.get(questionId);
      if (question && responses[questionId].selectedAnswerIds.length > 0) {
        responses[questionId] = this.evaluation.toResponse(
          question,
          responses[questionId].selectedAnswerIds,
        );
      }
    }

    const values = Object.values(responses);
    const result = normalizeResult({
      resultId: this.createId(),
      sessionId: session.sessionId,
      datasetVersion: session.datasetVersion,
      mode: session.mode,
      questionIds: [...session.questionIds],
      responses,
      config: session.config,
      startedAt: session.startedAt,
      completedAt: completedAt.toISOString(),
      durationSeconds: Math.max(0, Math.round((completedAt.getTime() - Date.parse(session.startedAt)) / 1_000)),
      correct: values.filter((response) => response.classification === 'correct').length,
      incorrect: values.filter((response) => response.classification === 'incorrect').length,
      unanswered: values.filter((response) => response.classification === 'unanswered').length,
    });

    this.progress.saveResult(result);
    this.progress.clearActiveSession();
    this.sessionState.set(null);
    this.timer.stop();
    return result;
  }

  clear(): void {
    this.progress.clearActiveSession();
    this.sessionState.set(null);
    this.timer.stop();
  }

  activeSession(): QuizSession | null {
    return this.sessionState() ?? this.progress.getActiveSession();
  }

  savePending(questionId: string, selected: string[]): void {
    const session = this.requireSession();
    this.commit({ ...session, pendingAnswers: { ...session.pendingAnswers, [questionId]: [...selected] } });
  }

  private commit(session: QuizSession): void {
    this.sessionState.set(session);
    this.progress.saveActiveSession(session);
  }

  private requireSession(): QuizSession {
    const session = this.sessionState();
    if (!session) {
      throw new Error('No active quiz session');
    }
    return session;
  }

  private createId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
