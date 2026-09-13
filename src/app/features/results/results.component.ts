import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { LocalProgressService } from '../../core/services/local-progress.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { AwsServiceIconComponent } from '../../shared/components/aws-service-icon/aws-service-icon.component';

@Component({
  selector: 'app-results', standalone: true, imports: [CommonModule, RouterLink, AwsServiceIconComponent],
  template: `<main class="results page-shell">@if (result; as current) {
    <p class="eyebrow">SESIÓN COMPLETADA</p><h1>{{ current.correct }} / {{ current.questionIds.length }}</h1><p class="score">{{ current.questionIds.length ? ((current.correct / current.questionIds.length) * 100 | number:'1.0-0') : 0 }}%</p>
    <section class="summary" aria-label="Resumen de resultados"><div><strong>{{ current.correct }}</strong><span>Correctas</span></div><div><strong>{{ current.incorrect }}</strong><span>Incorrectas</span></div><div><strong>{{ current.unanswered }}</strong><span>Sin responder</span></div><div><strong>{{ formatDuration(current.durationSeconds) }}</strong><span>Tiempo utilizado</span></div></section>
    @if (serviceStats().length) { <section class="result-services" aria-label="Servicios practicados"><h2>Servicios</h2><div class="service-list">@for (stat of serviceStats(); track stat.service.id) { <span class="service-chip"><app-aws-service-icon [iconKey]="stat.service.icon_key" [alt]="stat.service.name" [size]="28" /><span>{{ stat.service.short_name }}</span><small>{{ stat.correct }}/{{ stat.total }}</small></span> }</div></section> }
    <div class="actions"><a class="primary" routerLink="/review" [queryParams]="{ resultId: current.resultId }">Revisar errores</a><a class="secondary" routerLink="/practice">Nueva práctica</a></div>
  } @else { <h1>Aún no hay resultados</h1><p>Completa una sesión para ver tu rendimiento.</p><a class="primary" routerLink="/practice">Comenzar práctica</a> }</main>`,
  styles: [`:host{display:block}.page-shell{max-width:900px;margin:auto;padding:3.5rem 1.5rem}.eyebrow{color:var(--saa-accent,var(--p-primary-color));font-size:.72rem;font-weight:800;letter-spacing:.1em}.results h1{margin:.5rem 0 0;color:var(--saa-text,var(--p-text-color));font-size:clamp(3.5rem,8vw,5rem);letter-spacing:0}.score{margin:0 0 2rem;color:var(--saa-accent,var(--p-primary-color));font-size:2rem;font-weight:800}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:2rem 0}.summary div{display:grid;gap:.25rem;padding:1rem;background:var(--saa-surface-raised,var(--p-content-background));border:1px solid var(--saa-border,var(--p-surface-border));border-radius:5px}.summary strong{color:var(--saa-text,var(--p-text-color));font-size:1.5rem}.summary span{color:var(--saa-text-secondary,var(--p-text-muted-color));font-size:.85rem}.result-services{margin:2.5rem 0}.result-services h2{font-size:1.15rem}.service-list{display:flex;flex-wrap:wrap;gap:12px}.service-chip{display:flex;align-items:center;gap:.45rem;padding:.55rem .7rem;color:var(--saa-text,var(--p-text-color));background:var(--saa-surface-raised,var(--p-content-background));border:1px solid var(--saa-border,var(--p-surface-border));border-radius:5px;font-weight:700}.service-chip small{color:var(--saa-text-secondary,var(--p-text-muted-color));font-size:.8rem}.actions{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:2.5rem}.primary,.secondary{display:inline-block;padding:.85rem 1rem;text-decoration:none;font-weight:800;border-radius:3px}.primary{color:#fff;background:var(--saa-accent,var(--p-primary-color))}.secondary{color:var(--saa-text,var(--p-text-color));border:1px solid var(--saa-border,var(--p-surface-border))}@media(max-width:600px){.page-shell{padding:2rem 1rem}.summary{grid-template-columns:repeat(2,1fr)}}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsComponent {
  readonly result = inject(LocalProgressService).getResults()[0] ?? null;
  private readonly data = inject(DataService);
  readonly questions = toSignal(this.data.getQuestions(), { initialValue: [] });
  readonly services = toSignal(this.data.getServices(), { initialValue: [] });
  readonly serviceStats = computed(() => this.services().flatMap(service => {
    const questionIds = this.questions().filter(question => this.result?.questionIds.includes(question.id) && question.metadata?.primary_services?.includes(service.id)).map(question => question.id);
    if (!questionIds.length) return [];
    const correct = questionIds.filter(id => this.result?.responses[id]?.classification === 'correct').length;
    return [{ service, correct, total: questionIds.length }];
  }));

  formatDuration(totalSeconds: number): string {
    const total = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(total / 3_600);
    const minutes = Math.floor((total % 3_600) / 60);
    const seconds = total % 60;
    if (hours) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }
}
