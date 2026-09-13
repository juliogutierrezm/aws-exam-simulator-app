import { Injectable, signal } from '@angular/core';
import { ThemePreference } from '../models/quiz.model';
import { LocalProgressService } from './local-progress.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly preference = signal<ThemePreference>('system');

  private readonly mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor(private readonly progress: LocalProgressService) {
    this.preference.set(this.progress.getTheme());
    this.mediaQuery.addEventListener('change', () => this.apply());
    this.apply();
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    this.progress.saveTheme(preference);
    this.apply();
  }

  isDark(): boolean {
    return this.preference() === 'dark' ||
      (this.preference() === 'system' && this.mediaQuery.matches);
  }

  private apply(): void {
    document.documentElement.classList.toggle('dark-mode', this.isDark());
  }
}
