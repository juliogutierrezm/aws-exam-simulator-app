import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../core/services/data.service';
import { QuizSessionService } from '../../core/services/quiz-session.service';
import { ExamTimerService } from '../../core/services/exam-timer.service';
import { AwsService } from '../../core/models/aws-service.model';
import { AwsServiceIconComponent } from '../../shared/components/aws-service-icon/aws-service-icon.component';
import { SessionActionsService } from '../../core/services/session-actions.service';

@Component({ selector: 'app-quiz-session', standalone: true, imports: [AwsServiceIconComponent], templateUrl: './quiz-session.component.html', styleUrl: './quiz-session.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class QuizSessionComponent {
  private readonly data = inject(DataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly quiz = inject(QuizSessionService);
  private readonly actions = inject(SessionActionsService);
  readonly timer = inject(ExamTimerService);
  readonly questions = toSignal(this.data.getQuestions(), { initialValue: [] });
  readonly services = toSignal(this.data.getServices(), { initialValue: [] });
  readonly session = this.quiz.session;
  readonly question = computed(() => { const id = this.quiz.currentQuestionId(); return this.questions().find((item) => item.id === id) ?? null; });
  readonly selected = computed(() => this.question() ? this.session()?.answers[this.question()!.id]?.selectedAnswerIds ?? [] : []);
  readonly isExam = computed(() => this.session()?.mode === 'exam');
  readonly timingMode = computed(() => this.session()?.config.timingMode ?? 'untimed');
  readonly hasImmediateFeedback = computed(() => !this.isExam() || this.timingMode() === 'untimed');
  readonly checked = computed(() => this.hasImmediateFeedback() && this.question() ? Boolean(this.session()?.answers[this.question()!.id]) : false);
  readonly isCountdown = computed(() => this.timingMode() === 'countdown');
  readonly isStopwatch = computed(() => this.timingMode() === 'stopwatch');
  readonly currentServices = computed(() => {
    const ids = this.question()?.metadata?.primary_services ?? [];
    const services = new Map(this.services().map(service => [service.id, service]));
    return ids.map(id => services.get(id)).filter((service): service is AwsService => Boolean(service));
  });
  readonly answeredCount = computed(() => Object.keys(this.session()?.answers ?? {}).length);
  readonly unansweredCount = computed(() => (this.session()?.questionIds.length ?? 0) - this.answeredCount());

  constructor() {
    if (!this.quiz.restore()) {
      void this.router.navigate([this.route.snapshot.url[0]?.path === 'exam' ? '/exam' : '/practice'], {
        state: { message: 'La sesión anterior no era válida y fue descartada. Puedes iniciar una nueva sesión.' },
      });
      return;
    }
    this.pending.set(this.session()?.pendingAnswers?.[this.quiz.currentQuestionId() ?? ''] ?? []);
    effect(() => {
      if (this.timer.expired() && this.session() && this.questions().length) {
        this.finish();
      }
    });
  }

  toggle(answerId: string): void {
    const question = this.question();
    if (!question || this.checked() || this.timer.expired()) return;
    const current = this.hasImmediateFeedback() ? this.pending() : this.selected();
    const next = question.select_count === 1
      ? [answerId]
      : current.includes(answerId) ? current.filter((id) => id !== answerId) : [...current, answerId];
    if (next.length <= question.select_count) {
      const optionIds = (question.generated_question?.options || question.source_question?.options || []).map(option => option.id);
      const ordered = next.sort((left, right) => optionIds.indexOf(left) - optionIds.indexOf(right));
      if (this.hasImmediateFeedback()) this.pending.set(ordered);
      else this.quiz.answer(question, ordered);
    }
  }

  readonly pending = signal<string[]>([]);
  check(): void { const question = this.question(); if (question && this.hasImmediateFeedback()) this.quiz.answer(question, this.pending()); }
  next(): void {
    if ((this.quiz.currentIndex() + 1) < (this.session()?.questionIds.length ?? 0)) {
      this.quiz.next();
      this.loadPending();
    } else this.confirmFinish();
  }
  previous(): void { this.quiz.previous(); this.loadPending(); }
  toggleMarked(): void {
    const id = this.question()?.id;
    if (id) this.quiz.toggleMarked(id);
  }
  goTo(index: number): void { this.quiz.goTo(index); this.loadPending(); }
  isMarked(questionId: string): boolean { return this.session()?.markedForReview.includes(questionId) ?? false; }
  confirmFinish(): void {
    void this.actions.finish(this.questions());
  }
  finish(): void {
    if (!this.session()) return;
    this.actions.choose('cancel');
    const result = this.quiz.complete(this.questions());
    void this.router.navigate(['/results'], { state: { result } });
  }
  async canLeave(): Promise<boolean> {
    if (!this.session()) return true;
    const leave = await this.actions.leave();
    if (leave && this.session() && this.hasImmediateFeedback() && !this.checked() && this.question()) {
      this.quiz.savePending(this.question()!.id, this.pending());
    }
    return leave;
  }
  exit(): void { void this.router.navigate(['/']); }
  async discardSession(): Promise<void> {
    if (await this.actions.discard()) await this.router.navigate(['/']);
  }
  private loadPending(): void {
    this.pending.set(this.session()?.pendingAnswers?.[this.quiz.currentQuestionId() ?? ''] ?? []);
  }
  isSelected(answerId: string): boolean { return (this.checked() ? this.selected() : this.pending()).includes(answerId); }
  selectionCount(): number { return (this.checked() ? this.selected() : this.pending()).length; }
  canCheck(): boolean { const question = this.question(); return Boolean(question && this.selectionCount() === question.select_count); }
  isAnswered(questionId: string): boolean { return Boolean(this.session()?.answers[questionId]); }
  isCorrect(answerId: string): boolean { return this.question()?.generated_correct_answers?.includes(answerId) ?? false; }
}
