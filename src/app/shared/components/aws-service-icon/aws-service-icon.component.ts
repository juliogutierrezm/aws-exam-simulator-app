// src/app/shared/components/aws-service-icon/aws-service-icon.component.ts

import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconManifestService } from '../../../core/services/icon-manifest.service';

@Component({
  selector: 'app-aws-service-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aws-service-icon.component.html',
  styleUrl: './aws-service-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwsServiceIconComponent {
  /** The icon_key that maps to a specific SVG via the manifest */
  readonly iconKey = input.required<string>();

  /** Accessible label. Pass empty string to mark as decorative (aria-hidden). */
  readonly alt = input<string>('');

  /** Width/height in pixels (square aspect ratio). Default: 48 */
  readonly size = input<number>(48);

  /** Extra CSS classes to apply to the host <img> or fallback element */
  readonly extraClass = input<string>('');

  private readonly manifestService = inject(IconManifestService);

  readonly svgUrl = computed(() => this.manifestService.resolveUrl(this.iconKey()));

  readonly isDecorative = computed(() => this.alt() === '');

  readonly sizeStyle = computed(() => `${this.size()}px`);
}
