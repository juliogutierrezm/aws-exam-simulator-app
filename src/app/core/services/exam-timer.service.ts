import { Injectable, signal } from '@angular/core';
import { ExamTimingMode } from '../models/quiz.model';

export const DEFAULT_FULL_EXAM_DURATION_MINUTES = 130;
export const DEFAULT_MINUTES_PER_QUESTION = 2;

@Injectable({ providedIn: 'root' })
export class ExamTimerService {
  readonly remainingSeconds = signal(0);
  readonly elapsedSeconds = signal(0);
  readonly timingMode = signal<ExamTimingMode>('untimed');
  readonly expired = signal(false);

  private intervalId?: ReturnType<typeof setInterval>;
  private startedAt = 0;
  private expiresAt = 0;

  start(mode: ExamTimingMode, startedAt = new Date(), durationMinutes?: number): { startedAt: string; expiresAt?: string } {
    if (mode === 'countdown' && (!Number.isFinite(durationMinutes) || durationMinutes! <= 0)) {
      throw new Error('Countdown timing requires a positive duration');
    }
    this.timingMode.set(mode);
    this.startedAt = startedAt.getTime();
    this.expiresAt = mode === 'countdown' && durationMinutes ? this.startedAt + durationMinutes * 60_000 : 0;
    this.elapsedSeconds.set(Math.max(0, Math.floor((Date.now() - this.startedAt) / 1_000)));
    this.remainingSeconds.set(mode === 'countdown' ? Math.max(0, Math.ceil((this.expiresAt - Date.now()) / 1_000)) : 0);
    this.expired.set(false);
    this.stopInterval();
    this.update();
    if (mode !== 'untimed') {
      this.intervalId = setInterval(() => this.update(), 1_000);
    }
    return { startedAt: new Date(this.startedAt).toISOString(), ...(mode === 'countdown' ? { expiresAt: new Date(this.expiresAt).toISOString() } : {}) };
  }

  restore(mode: ExamTimingMode, startedAt: string, expiresAt?: string): void {
    this.timingMode.set(mode);
    this.startedAt = Date.parse(startedAt);
    this.expiresAt = expiresAt ? Date.parse(expiresAt) : 0;
    this.elapsedSeconds.set(Math.max(0, Math.floor((Date.now() - this.startedAt) / 1_000)));
    this.expired.set(false);
    this.remainingSeconds.set(mode === 'countdown' ? Math.max(0, Math.ceil((this.expiresAt - Date.now()) / 1_000)) : 0);
    this.stopInterval();
    this.update();
    if (mode !== 'untimed') {
      this.intervalId = setInterval(() => this.update(), 1_000);
    }
  }

  stop(): void {
    this.stopInterval();
  }

  dispose(): void {
    this.stop();
  }

  formatRemaining(): string {
    const total = this.remainingSeconds();
    const hours = Math.floor(total / 3_600);
    const minutes = Math.floor((total % 3_600) / 60);
    const seconds = total % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  }

  formatElapsed(): string {
    const total = this.elapsedSeconds();
    const hours = Math.floor(total / 3_600);
    const minutes = Math.floor((total % 3_600) / 60);
    const seconds = total % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  }

  private update(): void {
    if (this.timingMode() === 'stopwatch') {
      this.elapsedSeconds.set(Math.max(0, Math.floor((Date.now() - this.startedAt) / 1_000)));
      return;
    }

    if (this.timingMode() === 'countdown') {
      const remaining = Math.max(0, Math.ceil((this.expiresAt - Date.now()) / 1_000));
      this.remainingSeconds.set(remaining);
      if (remaining === 0) {
        this.expired.set(true);
        this.stopInterval();
      }
    }
  }

  private stopInterval(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
