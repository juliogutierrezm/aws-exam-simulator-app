import { TestBed } from '@angular/core/testing';
import { Question } from '../models/question.model';
import { QuizConfig } from '../models/quiz.model';
import { QuizGeneratorService } from './quiz-generator.service';

describe('QuizGeneratorService', () => {
  let service: QuizGeneratorService;
  const questions = (['a', 'b', 'c'] as const).map((id, index): Question => ({
    schema_version: '2.3', id, exam_id: 'saa-e01', bank_index: index, exam: 'Exam',
    source_question_number: index + 1, topic: 'Topic', exam_domain: index === 2 ? 'secure' : 'resilient',
    select_count: index + 1, source_question: { scenario: id, options: [] }, source_correct_answers: ['A'],
    generated_question: { scenario: id, options: [] }, generated_correct_answers: ['A'],
    metadata: { primary_services: index === 0 ? ['s3'] : ['ec2'], difficulty: index === 1 ? 'hard' : 'easy', concepts: ['storage'] },
  }));
  const config: QuizConfig = { mode: 'practice', questionCount: 2, timingMode: 'untimed' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [QuizGeneratorService] });
    service = TestBed.inject(QuizGeneratorService);
  });

  it('filters by primary service and selects without duplicates', () => {
    const result = service.generate(questions, { ...config, questionCount: 1, serviceId: 's3' });
    expect(result.map((question) => question.id)).toEqual(['a']);
  });

  it('filters by domain without using dataset difficulty as a product filter', () => {
    const result = service.getAvailableQuestions(questions, {
      ...config, domainId: 'resilient',
    });
    expect(result.map((question) => question.id)).toEqual(['a', 'b']);
  });

  it('filters by select count and combines it with the service filter', () => {
    const result = service.getAvailableQuestions(questions, {
      ...config, serviceId: 'ec2', selectCount: 3,
    });
    expect(result.map((question) => question.id)).toEqual(['c']);
  });

  it('treats a null select count as no selection filter', () => {
    const result = service.getAvailableQuestions(questions, { ...config, selectCount: null });
    expect(result).toHaveSize(3);
  });

  it('rejects a count larger than the filtered bank', () => {
    expect(() => service.generate(questions, { ...config, questionCount: 4 })).toThrow();
  });
});
