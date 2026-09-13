import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { LocalProgressService } from '../../core/services/local-progress.service';
import { normalizeResult } from '../../core/models/quiz-result';
import { ReviewComponent } from './review.component';
import { Question } from '../../core/models/question.model';

describe('Review rendered attempt detail', () => {
  it('renders only failures of the selected result, including after changing resultId', async () => {
    const params = new BehaviorSubject(convertToParamMap({ resultId: 'one' }));
    const results = ['one', 'two'].map(id => normalizeResult({
      resultId: id, sessionId: id, datasetVersion: '2.3', mode: 'exam',
      config: { mode: 'exam', examId: 'saa-e03', questionCount: 2, timingMode: 'untimed' },
      questionIds: ['right', id], responses: {
        right: { questionId: 'right', selectedAnswerIds: ['A'], classification: 'correct' },
        [id]: { questionId: id, selectedAnswerIds: ['B'], classification: 'incorrect' },
      }, startedAt: '2026-09-13T12:00:00Z', completedAt: '2026-09-13T12:01:00Z',
      correct: 1, incorrect: 1, unanswered: 0, durationSeconds: 60,
    }));
    const questions = ['right', 'one', 'two'].map(id => ({ id, generated_question: { scenario: id + ' scenario', options: [] } })) as unknown as Question[];
    TestBed.configureTestingModule({ imports: [ReviewComponent], providers: [
      provideRouter([]), { provide: ActivatedRoute, useValue: { queryParamMap: params } },
      { provide: LocalProgressService, useValue: { getResults: () => results } },
      { provide: DataService, useValue: { getQuestions: () => of(questions), getServices: () => of([]), getDomains: () => of([]) } },
    ] });
    const fixture = TestBed.createComponent(ReviewComponent);
    fixture.autoDetectChanges(); await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('one scenario');
    expect(fixture.nativeElement.textContent).not.toContain('right scenario');
    expect(fixture.nativeElement.textContent).not.toContain('two scenario');
    params.next(convertToParamMap({ resultId: 'two' })); await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('two scenario');
    expect(fixture.nativeElement.textContent).not.toContain('one scenario');
  });
});
