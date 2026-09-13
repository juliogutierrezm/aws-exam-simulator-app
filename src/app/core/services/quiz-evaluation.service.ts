import { Injectable } from '@angular/core';
import { Question } from '../models/question.model';
import { AnswerClassification, QuestionResponse } from '../models/quiz.model';

export interface EvaluationResult {
  classification: AnswerClassification;
  correctAnswerIds: string[];
  selectedAnswerIds: string[];
  incorrectSelectedAnswerIds: string[];
  missedCorrectAnswerIds: string[];
}

@Injectable({ providedIn: 'root' })
export class QuizEvaluationService {
  evaluate(question: Question, selectedAnswerIds: string[] | undefined): EvaluationResult {
    const correctAnswerIds = this.unique(question.generated_correct_answers ?? question.source_correct_answers ?? []);
    const selected = this.unique(selectedAnswerIds ?? []);
    const correctSet = new Set(correctAnswerIds);
    const selectedSet = new Set(selected);
    const exactMatch =
      selected.length === correctAnswerIds.length &&
      correctAnswerIds.every((answerId) => selectedSet.has(answerId));

    return {
      classification: selected.length === 0 ? 'unanswered' : exactMatch ? 'correct' : 'incorrect',
      correctAnswerIds,
      selectedAnswerIds: selected,
      incorrectSelectedAnswerIds: selected.filter((answerId) => !correctSet.has(answerId)),
      missedCorrectAnswerIds: correctAnswerIds.filter((answerId) => !selectedSet.has(answerId)),
    };
  }

  toResponse(question: Question, selectedAnswerIds: string[] | undefined): QuestionResponse {
    const evaluation = this.evaluate(question, selectedAnswerIds);
    return {
      questionId: question.id,
      selectedAnswerIds: evaluation.selectedAnswerIds,
      classification: evaluation.classification,
    };
  }

  private unique(answerIds: string[]): string[] {
    return [...new Set(answerIds)];
  }
}
