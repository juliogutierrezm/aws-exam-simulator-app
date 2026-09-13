import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { QuizSessionService } from './quiz-session.service';
import { Question } from '../models/question.model';

export type SessionDecision = 'cancel' | 'continue' | 'replace' | 'leave' | 'discard' | 'finish';
export interface SessionDialogAction {
  id: SessionDecision; label: string; style: 'primary' | 'danger' | 'danger-outline' | 'quiet';
}
export interface SessionDialogRequest {
  title: string; message: string; actions: SessionDialogAction[];
}
const cancel: SessionDialogAction = { id: 'cancel', label: 'Cancelar', style: 'quiet' };
const resume: SessionDialogAction = { id: 'continue', label: 'Continuar sesión', style: 'primary' };

@Injectable({ providedIn: 'root' })
export class SessionActionsService {
  private readonly quiz = inject(QuizSessionService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private opener: HTMLElement | null = null;
  private readonly requestState = signal<SessionDialogRequest | null>(null);
  readonly request = this.requestState.asReadonly();
  private resolve?: (decision: SessionDecision) => void;

  choose(decision: SessionDecision): void {
    if (!this.request()?.actions.some(action => action.id === decision) && decision !== 'cancel') return;
    const resolve = this.resolve;
    this.resolve = undefined;
    this.requestState.set(null);
    resolve?.(decision);
  }

  private ask(request: SessionDialogRequest): Promise<SessionDecision> {
    // A second click must not replace an unresolved decision.
    if (this.request()) return Promise.resolve('cancel');
    this.opener = this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
    this.requestState.set(request);
    return new Promise(resolve => { this.resolve = resolve; });
  }

  restoreFocus(): void { if (this.opener?.isConnected) this.opener.focus(); }

  async beforeStart(): Promise<boolean> {
    const active = this.quiz.activeSession();
    if (!active) return true;
    const choice = await this.ask({
      title: 'Ya existe una sesión activa',
      message: 'Puedes continuar donde lo dejaste. Si descartas y comienzas otra, perderás el progreso de la sesión activa. Tus resultados anteriores se conservarán.',
      actions: [resume, { id: 'replace', label: 'Descartar y comenzar otra', style: 'danger-outline' }, cancel],
    });
    if (this.quiz.activeSession()?.sessionId !== active.sessionId) return false;
    if (choice === 'continue') await this.router.navigate([active.mode === 'exam' ? '/exam/session' : '/practice/session']);
    if (choice === 'replace') { this.quiz.clear(); return true; }
    return false;
  }

  async discard(): Promise<boolean> {
    const active = this.quiz.activeSession();
    if (!active) return false;
    const choice = await this.ask({
      title: '¿Descartar la sesión activa?',
      message: 'Se perderán las respuestas y el progreso de esta sesión. Tus resultados anteriores y preferencias se conservarán. Esta acción no se puede deshacer.',
      actions: [cancel, { id: 'discard', label: 'Descartar sesión', style: 'danger' }],
    });
    if (choice !== 'discard' || this.quiz.activeSession()?.sessionId !== active.sessionId) return false;
    this.quiz.clear();
    return true;
  }

  async leave(): Promise<boolean> {
    const active = this.quiz.activeSession();
    if (!active) return true;
    const choice = await this.ask({
      title: active.mode === 'exam' ? '¿Quieres salir del examen?' : '¿Quieres salir de la práctica?',
      message: 'Salir y conservar progreso guarda tus respuestas para continuar después. Descartar elimina solo esta sesión.' +
        (active.config.timingMode === 'countdown' ? ' La cuenta regresiva no se pausa al salir; si expira, se finalizará al volver.' : ' El tiempo utilizado se calcula desde el inicio de la sesión.'),
      actions: [cancel, { id: 'leave', label: 'Salir y conservar progreso', style: 'primary' }, { id: 'discard', label: 'Descartar y salir', style: 'danger-outline' }],
    });
    if (this.quiz.activeSession()?.sessionId !== active.sessionId) return false;
    if (choice === 'discard') this.quiz.clear();
    return choice === 'leave' || choice === 'discard';
  }

  async finish(questions: Question[]): Promise<void> {
    const active = this.quiz.activeSession();
    if (!active) return;
    const unanswered = active.questionIds.filter(id => !active.answers[id]?.selectedAnswerIds.length).length;
    const choice = await this.ask({
      title: active.mode === 'exam' ? '¿Finalizar el examen?' : '¿Finalizar la práctica?',
      message: `Tienes ${unanswered} preguntas sin responder. Se guardará el resultado y ya no podrás cambiar las respuestas de este intento. Las preguntas sin responder no suman puntos.`,
      actions: [cancel, { id: 'finish', label: active.mode === 'exam' ? 'Finalizar examen' : 'Finalizar práctica', style: 'danger' }],
    });
    if (choice !== 'finish' || this.quiz.activeSession()?.sessionId !== active.sessionId) return;
    const result = this.quiz.complete(questions);
    await this.router.navigate(['/results'], { state: { result } });
  }
}
