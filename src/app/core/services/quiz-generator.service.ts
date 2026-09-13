import { Injectable } from '@angular/core';
import { Question } from '../models/question.model';
import { QuizConfig } from '../models/quiz.model';

@Injectable({ providedIn: 'root' })
export class QuizGeneratorService {
  getAvailableQuestions(questions: Question[], config: QuizConfig): Question[] {
    const filtered = questions.filter((question) => {
      const metadata = question.metadata;
      return (
        (!config.serviceId || metadata?.primary_services?.includes(config.serviceId)) &&
        (!config.domainId || question.exam_domain === config.domainId) &&
        (!config.examId || question.exam_id === config.examId) &&
        (!config.conceptId || metadata?.concepts?.includes(config.conceptId))
      );
    });

    return [...new Map(filtered.map((question) => [question.id, question])).values()];
  }

  generate(questions: Question[], config: QuizConfig): Question[] {
    const available = this.shuffle(this.getAvailableQuestions(questions, config));
    const questionCount = config.questionCount;

    if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > available.length) {
      throw new Error(`Requested ${questionCount} questions, but only ${available.length} are available`);
    }

    return available.slice(0, questionCount);
  }

  private shuffle(questions: Question[]): Question[] {
    const shuffled = [...questions];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }
}
