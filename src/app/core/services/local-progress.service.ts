import { Injectable } from '@angular/core';
import { QuizResult, QuizSession, ThemePreference } from '../models/quiz.model';
import { normalizeResult } from '../models/quiz-result';

const SESSION_KEY = 'aws-saa-app:v1:session';
const PROGRESS_KEY = 'aws-saa-app:v1:progress';
const SETTINGS_KEY = 'aws-saa-app:v1:settings';

interface ProgressState {
  results: QuizResult[];
  failedQuestionIds: string[];
}

interface SettingsState {
  theme?: unknown;
}

@Injectable({ providedIn: 'root' })
export class LocalProgressService {
  getActiveSession(): QuizSession | null {
    return this.read<QuizSession>(SESSION_KEY);
  }

  saveActiveSession(session: QuizSession): void {
    this.write(SESSION_KEY, session);
  }

  clearActiveSession(): void {
    this.remove(SESSION_KEY);
  }

  getResults(): QuizResult[] {
    return (this.read<ProgressState>(PROGRESS_KEY)?.results ?? []).map(normalizeResult);
  }

  saveResult(result: QuizResult): void {
    const previous = this.read<ProgressState>(PROGRESS_KEY);
    const failedQuestionIds = Object.values(result.responses)
      .filter((response) => response.classification !== 'correct')
      .map((response) => response.questionId);
    const next: ProgressState = {
      results: [result, ...(previous?.results ?? [])].slice(0, 20),
      failedQuestionIds: [...new Set(failedQuestionIds)],
    };
    this.write(PROGRESS_KEY, next);
  }

  getFailedQuestionIds(): string[] {
    return this.read<ProgressState>(PROGRESS_KEY)?.failedQuestionIds ?? [];
  }

  getTheme(): ThemePreference {
    const theme = this.read<SettingsState>(SETTINGS_KEY)?.theme;
    return theme === 'dark' || theme === 'light' ? theme : 'light';
  }

  saveTheme(theme: ThemePreference): void {
    this.write(SETTINGS_KEY, { theme });
  }

  private read<T>(key: string): T | null {
    try {
      const value = localStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  }

  private write<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Local progress is best effort when storage is unavailable.
    }
  }

  private remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Local progress is best effort when storage is unavailable.
    }
  }
}
