import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SessionActionsService } from '../../../core/services/session-actions.service';

@Component({
  selector: 'app-session-dialog', standalone: true, imports: [DialogModule, ButtonModule],
  templateUrl: './session-dialog.component.html', styleUrl: './session-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionDialogComponent {
  readonly actions = inject(SessionActionsService);
}
