import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../core/services/data.service';
import { LocalProgressService } from '../../core/services/local-progress.service';
import { Question } from '../../core/models/question.model';
import { QuizResult } from '../../core/models/quiz.model';
import { describeSource, formatDuration } from '../../core/models/quiz-result';
import { AwsServiceIconComponent } from '../../shared/components/aws-service-icon/aws-service-icon.component';
import { filterAttempts, reviewGroups, ReviewFilters } from './review-state';

@Component({
  selector: 'app-review', standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, AwsServiceIconComponent],
  templateUrl: './review.component.html', styleUrl: './review.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewComponent {
  private readonly data = inject(DataService);
  private readonly router = inject(Router);
  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap);
  readonly results = inject(LocalProgressService).getResults();
  readonly questions = toSignal(this.data.getQuestions(), { initialValue: [] });
  readonly services = toSignal(this.data.getServices(), { initialValue: [] });
  readonly domains = toSignal(this.data.getDomains(), { initialValue: [] });
  readonly filters = signal<ReviewFilters>({ mode: 'all', examId: '', serviceId: '' });
  readonly includeUnanswered = signal(true);
  readonly selectedId = computed(() => this.params()?.get('resultId') ?? '');
  readonly attempts = computed(() => filterAttempts(this.results, this.filters()));
  readonly groups = computed(() => reviewGroups(this.selectedId() === 'all' ? this.attempts() : this.results, this.selectedId(), this.includeUnanswered()));
  readonly questionMap = computed(() => new Map(this.questions().map(question => [question.id, question])));
  readonly examOptions = Array.from({ length: 8 }, (_, i) => ({ id: `saa-e0${i + 1}`, label: `Examen ${i + 1}` }));
  readonly serviceOptions = computed(() => [...new Set(this.results.flatMap(r => r.serviceId ? [r.serviceId] : []))].map(id => ({
    id, label: this.services().find(s => s.id === id)?.name ?? this.results.find(r => r.serviceId === id)?.source.label ?? id,
  })));
  readonly errorCount = computed(() => this.groups().reduce((sum, group) => sum + group.items.length, 0));
  readonly formatDuration = formatDuration;

  setFilter<K extends keyof ReviewFilters>(key: K, value: ReviewFilters[K]): void {
    this.filters.update(filters => ({ ...filters, [key]: value }));
    if (this.selectedId() && this.selectedId() !== 'all') this.open('');
  }
  open(resultId: string): void {
    void this.router.navigate(['/review'], { queryParams: resultId ? { resultId } : {} });
  }
  label(result: QuizResult): string {
    // Old records only carried catalog IDs; resolve those labels when catalog data arrives.
    const fallback = describeSource(result.config).label;
    if (result.source.label !== fallback) return result.source.label;
    return describeSource(result.config, {
      service: this.services().find(s => s.id === result.serviceId)?.name,
      domain: this.domains().find(d => d.id === result.domainId)?.name,
    }).label;
  }
  reviewServices(question: Question) {
    return this.services().filter(service => question.metadata?.primary_services?.includes(service.id));
  }
  answerText(question: Question, answerIds: string[]): string {
    const options = question.generated_question?.options || question.source_question?.options || [];
    return answerIds.map(id => `${id} — ${options.find(option => option.id === id)?.text ?? id}`).join('; ');
  }
}
