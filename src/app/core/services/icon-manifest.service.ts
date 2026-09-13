// src/app/core/services/icon-manifest.service.ts
// Resolves icon_key → SVG URL, with fallback for unknown keys.

import { Injectable, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, catchError, of } from 'rxjs';
import { DataService } from './data.service';
import { AwsIconManifest } from '../models/aws-icon-manifest.model';

@Injectable({ providedIn: 'root' })
export class IconManifestService {
  private readonly dataService = inject(DataService);

  /** Reactive signal; null while loading, {} on error */
  readonly manifest: Signal<AwsIconManifest | null> = toSignal(
    this.dataService.getIconManifest().pipe(
      catchError(() => of({} as AwsIconManifest))
    ),
    { initialValue: null }
  );

  /**
   * Resolve an icon_key to the full URL for the SVG asset.
   * Returns null if the manifest is still loading or the key is unknown.
   */
  resolveUrl(iconKey: string): string | null {
    const m = this.manifest();
    if (!m || !m[iconKey]) return null;
    return `/aws-icons/${m[iconKey].file}`;
  }

  /**
   * Check whether a given icon_key has a resolved SVG.
   */
  hasIcon(iconKey: string): boolean {
    const m = this.manifest();
    return !!m && iconKey in m;
  }
}
