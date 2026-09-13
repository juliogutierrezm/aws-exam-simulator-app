import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../core/services/data.service';
import { LocalProgressService } from '../../core/services/local-progress.service';
import { SessionActionsService } from '../../core/services/session-actions.service';
import { QuizSession } from '../../core/models/quiz.model';
import { ThemeService } from '../../core/services/theme.service';
import { AwsServiceIconComponent } from '../../shared/components/aws-service-icon/aws-service-icon.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, AwsServiceIconComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly data = inject(DataService);
  readonly theme = inject(ThemeService);
  readonly questions = toSignal(this.data.getQuestions(), { initialValue: [] });
  readonly services = toSignal(this.data.getServices(), { initialValue: [] });
  readonly domains = toSignal(this.data.getDomains(), { initialValue: [] });
  private readonly progress = inject(LocalProgressService);
  private readonly actions = inject(SessionActionsService);
  readonly results = this.progress.getResults();
  readonly activeSession = signal<QuizSession | null>(this.progress.getActiveSession());
  readonly questionCount = computed(() => this.questions().length);
  readonly examCount = computed(() => new Set(this.questions().map((question) => question.exam_id)).size);
  readonly popularServices = computed(() => this.services().filter((service) => service.question_count > 0).slice(0, 6));
  readonly answered = computed(() => this.results.reduce((total, result) => total + result.questionIds.length - result.unanswered, 0));
  readonly accuracy = computed(() => {
    const total = this.results.reduce((sum, result) => sum + result.correct + result.incorrect, 0);
    const correct = this.results.reduce((sum, result) => sum + result.correct, 0);
    return total ? Math.round((correct / total) * 100) : 0;
  });

  async resetActiveSession(): Promise<void> {
    if (await this.actions.discard()) this.activeSession.set(null);
  }
}
