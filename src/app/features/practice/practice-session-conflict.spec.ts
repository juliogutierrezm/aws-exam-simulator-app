import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { PracticeComponent } from './practice.component';
import { QuizSessionService } from '../../core/services/quiz-session.service';
import { SessionActionsService } from '../../core/services/session-actions.service';
import { LocalProgressService } from '../../core/services/local-progress.service';
import { DataService } from '../../core/services/data.service';
import { QuizSession } from '../../core/models/quiz.model';
import { Question } from '../../core/models/question.model';

describe('Builder session conflict workflow', () => {
  let stored: QuizSession | null;
  const questions = Array.from({ length: 10 }, (_, i) => ({
    id: 'q' + i, select_count: 1, metadata: { primary_services: ['amazon-s3'] },
  })) as Question[];
  const router = { navigate: jasmine.createSpy().and.resolveTo(true) };
  beforeEach(() => {
    stored = null; router.navigate.calls.reset();
    TestBed.configureTestingModule({ imports: [PracticeComponent], providers: [
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: { snapshot: { routeConfig: { path: 'practice' }, queryParamMap: convertToParamMap({ service: 'amazon-s3' }) } } },
      { provide: DataService, useValue: { getQuestions: () => of(questions), getServices: () => of([{ id: 'amazon-s3', name: 'Amazon S3' }]), getDomains: () => of([]) } },
      { provide: LocalProgressService, useValue: { getActiveSession: () => stored, saveActiveSession: (s: QuizSession) => stored = s, clearActiveSession: () => stored = null } },
    ] });
    TestBed.inject(QuizSessionService).create(questions, { mode: 'practice', questionCount: 5, timingMode: 'untimed' });
  });
  it('Discard and start creates the requested session with its catalog label', async () => {
    const oldId = stored?.sessionId;
    const component = TestBed.createComponent(PracticeComponent).componentInstance;
    const pending = component.start();
    TestBed.inject(SessionActionsService).choose('replace');
    await pending;
    expect(stored?.sessionId).not.toBe(oldId);
    expect(stored?.questionIds.length).toBe(10);
    expect(stored?.config.source).toEqual({ type: 'service-practice', label: 'Amazon S3' });
    expect(router.navigate).toHaveBeenCalledOnceWith(['/practice/session']);
  });
  it('Cancel creates nothing, preserves the existing session and unlocks the start button', async () => {
    const previous = JSON.stringify(stored);
    const component = TestBed.createComponent(PracticeComponent).componentInstance;
    const pending = component.start();
    TestBed.inject(SessionActionsService).choose('cancel');
    await pending;
    expect(JSON.stringify(stored)).toBe(previous);
    expect(component.starting()).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
