import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { getMockQuestionDiscussion } from './question-discussion.mock';

@Component({
  selector: 'app-question-discussion',
  standalone: true,
  templateUrl: './question-discussion.component.html',
  styleUrl: './question-discussion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionDiscussionComponent {
  readonly questionId = input.required<string>();
  readonly discussion = computed(() => getMockQuestionDiscussion(this.questionId()));
  readonly participationCount = computed(() => this.discussion().comments.reduce((total, comment) => total + 1 + comment.replies.length, 0));
}
