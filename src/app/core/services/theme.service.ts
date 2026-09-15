import { Injectable, signal } from '@angular/core';
import { ThemePreference } from '../models/quiz.model';
import { LocalProgressService } from './local-progress.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly preference = signal<ThemePreference>('light');

  constructor(private readonly progress: LocalProgressService) {
    this.preference.set(this.progress.getTheme());
    this.apply();
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    this.progress.saveTheme(preference);
    this.apply();
  }

  isDark(): boolean {
    return this.preference() === 'dark';
  }

  private apply(): void {
    document.documentElement.classList.toggle('dark-mode', this.isDark());
  }
}
