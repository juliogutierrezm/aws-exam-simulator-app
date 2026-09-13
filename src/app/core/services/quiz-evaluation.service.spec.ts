import { TestBed } from '@angular/core/testing';
import { Question } from '../models/question.model';
import { QuizEvaluationService } from './quiz-evaluation.service';

describe('QuizEvaluationService', () => {
  let service: QuizEvaluationService;
  const question: Question = {
    schema_version: '2.3', id: 'q1', exam_id: 'saa-e01', bank_index: 1, exam: 'Exam',
    source_question_number: 1, topic: 'Topic', exam_domain: 'secure', select_count: 2,
    source_question: { scenario: 'Question', options: [] }, source_correct_answers: ['A', 'C'],
    generated_question: { scenario: 'Question', options: [] }, generated_correct_answers: ['A', 'C'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [QuizEvaluationService] });
    service = TestBed.inject(QuizEvaluationService);
  });

  it('requires exact match for multi-select answers', () => {
    expect(service.evaluate(question, ['A', 'C']).classification).toBe('correct');
    expect(service.evaluate(question, ['A']).classification).toBe('incorrect');
    expect(service.evaluate(question, ['A', 'B']).classification).toBe('incorrect');
  });

  it('classifies empty answers as unanswered', () => {
    expect(service.evaluate(question, []).classification).toBe('unanswered');
  });
});
