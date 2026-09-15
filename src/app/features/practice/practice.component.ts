import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../core/services/data.service';
import { QuizSessionService } from '../../core/services/quiz-session.service';
import { ExamTimingMode, QuizConfig } from '../../core/models/quiz.model';
import { describeSource } from '../../core/models/quiz-result';
import { SessionActionsService } from '../../core/services/session-actions.service';
import { QuizGeneratorService } from '../../core/services/quiz-generator.service';
import { FormsModule } from '@angular/forms';
import { AwsServiceIconComponent } from '../../shared/components/aws-service-icon/aws-service-icon.component';
import { SelectCountFilter } from '../../core/models/quiz.model';

export function getValidCountOptions(available: number, isExam: boolean): number[] {
  if (available <= 2) return Array.from({ length: available }, (_, index) => index + 1);
  const base = isExam ? [5, 10, 20, 30, 50, 65] : [5, 10, 20, 30, 50];
  return base.filter(count => count <= available);
}

export function getEffectiveCount(selected: number, valid: number[]): number {
  if (!valid.length || selected === 0) return 0;
  return valid.includes(selected) ? selected : valid[valid.length - 1];
}

export interface ExamSourceOption {
  id: string;
  label: string;
  description: string;
}

@Component({ selector: 'app-practice', standalone: true, imports: [FormsModule, AwsServiceIconComponent], templateUrl: './practice.component.html', styleUrl: './practice.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class PracticeComponent {
  private readonly data = inject(DataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(QuizSessionService);
  private readonly actions = inject(SessionActionsService);
  private readonly generator = inject(QuizGeneratorService);
  readonly questions = toSignal(this.data.getQuestions(), { initialValue: [] });
  readonly services = toSignal(this.data.getServices(), { initialValue: [] });
  readonly domains = toSignal(this.data.getDomains(), { initialValue: [] });
  readonly serviceFromUrl = this.route.snapshot.queryParamMap.get('service') ?? '';
  readonly isExam = this.route.snapshot.routeConfig?.path === 'exam';
  readonly count = signal(10);
  readonly examSource = signal('random');
  readonly examSources: ExamSourceOption[] = [
    ...Array.from({ length: 8 }, (_, index) => ({ id: `saa-e0${index + 1}`, label: `Exam ${index + 1}`, description: '65 preguntas' })),
    { id: 'random', label: 'Examen aleatorio', description: '65 preguntas aleatorias de las 520' },
  ];
  readonly serviceId = signal(this.serviceFromUrl);
  readonly domainId = signal('');
  readonly selectedSelectCount = signal<SelectCountFilter | null>(null);
  readonly selectCountOptions: Array<{ value: SelectCountFilter | null; label: string }> = [
    { value: null, label: 'Todas' },
    { value: 1, label: 'Única' },
    { value: 2, label: 'Múltiple (2)' },
    { value: 3, label: 'Múltiple (3)' },
  ];
  readonly timingMode = signal<ExamTimingMode>('stopwatch');
  readonly starting = signal(false);
  readonly startError = signal<string | null>(null);
  readonly restoreMessage = signal(typeof window !== 'undefined' ? window.history.state?.message ?? null : null);
  readonly availableCount = computed(() => this.generator.getAvailableQuestions(this.questions(), this.buildConfig()).length);
  readonly selectedService = computed(() => this.services().find(service => service.id === this.serviceId()) ?? null);
  readonly validCountOptions = computed(() => {
    return this.isExam ? [65] : getValidCountOptions(this.availableCount(), false);
  });
  readonly effectiveCount = computed(() => {
    const valid = this.validCountOptions();
    return getEffectiveCount(this.count(), valid);
  });
  readonly countWasAdjusted = computed(() => this.count() > 0 && this.effectiveCount() !== this.count());

  selectCount(count: number): void { this.count.set(count); }

  async start(): Promise<void> {
    if (!this.availableCount() || this.starting()) return;
    this.starting.set(true);
    this.startError.set(null);
    try {
      if (!await this.actions.beforeStart()) return;
      const count = this.isExam ? 65 : (this.effectiveCount() === 0 ? this.availableCount() : this.effectiveCount());
      const config: QuizConfig = { ...this.buildConfig(), questionCount: count };
      config.source = describeSource(config, { service: this.selectedService()?.name, domain: this.domains().find(d => d.id === this.domainId())?.name });
      this.session.create(this.questions(), config);
      await this.router.navigate([this.isExam ? '/exam/session' : '/practice/session']);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar la sesión.';
      this.startError.set(message);
    } finally {
      this.starting.set(false);
    }
  }

  private buildConfig(): QuizConfig {
    return {
      mode: this.isExam ? 'exam' : 'practice',
      questionCount: 1,
      serviceId: this.isExam ? undefined : (this.serviceId() || undefined),
      domainId: this.isExam ? undefined : (this.domainId() || undefined),
      examId: this.isExam && this.examSource() !== 'random' ? this.examSource() : undefined,
      selectCount: this.isExam ? null : this.selectedSelectCount(),
      timingMode: this.isExam ? this.timingMode() : 'untimed',
      durationMinutes: this.isExam && this.timingMode() === 'countdown' ? 130 : undefined,
    };
  }

}
