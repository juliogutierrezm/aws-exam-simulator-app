import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ExamTimerService } from './exam-timer.service';

describe('ExamTimerService', () => {
  let service: ExamTimerService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ExamTimerService] });
    service = TestBed.inject(ExamTimerService);
  });

  afterEach(() => service.dispose());

  it('keeps untimed sessions non-expiring', () => {
    service.start('untimed', new Date(Date.now() - 10_000));
    expect(service.expired()).toBeFalse();
    expect(service.remainingSeconds()).toBe(0);
  });

  it('derives stopwatch elapsed time from startedAt after refresh', fakeAsync(() => {
    service.restore('stopwatch', new Date(Date.now() - 6_000).toISOString());
    expect(service.elapsedSeconds()).toBe(6);
    tick(2_000);
    expect(service.elapsedSeconds()).toBeGreaterThanOrEqual(8);
    expect(service.expired()).toBeFalse();
  }));

  it('expires only countdown sessions', fakeAsync(() => {
    service.start('countdown', new Date(), 1 / 60);
    expect(service.expired()).toBeFalse();
    tick(1_100);
    expect(service.expired()).toBeTrue();
    expect(service.remainingSeconds()).toBe(0);
  }));
});
