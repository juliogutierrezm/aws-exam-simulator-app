import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../core/services/data.service';
import { AwsServiceIconComponent } from '../../shared/components/aws-service-icon/aws-service-icon.component';

@Component({ selector: 'app-services', standalone: true, imports: [RouterLink, AwsServiceIconComponent], template: `
<main class="catalog page-shell"><p class="eyebrow">AWS CATALOG</p><h1>Servicios AWS</h1><p class="lede">Elige un servicio para practicar preguntas centradas en sus decisiones de arquitectura.</p><input class="search" aria-label="Buscar servicios" placeholder="Buscar por nombre o categoría" (input)="search.set($any($event.target).value)" />
<section class="service-grid">@for (service of filtered(); track service.id) { <a class="service-card" [routerLink]="['/practice']" [queryParams]="{ service: service.id }"><app-aws-service-icon [iconKey]="service.icon_key" [alt]="service.name" [size]="32" /><strong>{{ service.name }}</strong><span>{{ service.category }} · {{ service.question_count }} preguntas</span></a> }</section>@if (!filtered().length) { <p class="empty" role="status">No hay servicios con preguntas para esta búsqueda.</p> }</main>`, styles: [`:host{display:block}.page-shell{max-width:1180px;margin:auto;padding:3.5rem 1.5rem}.eyebrow{color:var(--p-primary-color);font-size:.72rem;font-weight:800;letter-spacing:.1em}.lede{color:var(--p-text-muted-color);font-size:1.1rem}.search{width:100%;max-width:560px;margin:2rem 0;padding:.9rem;color:var(--p-text-color);background:var(--p-content-background);border:1px solid var(--p-surface-border);font:inherit}.service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem}.service-card{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:.15rem .7rem;padding:1rem;color:var(--p-text-color);border:1px solid var(--p-surface-border);text-decoration:none}.service-card span:last-child{grid-column:2;color:var(--p-text-muted-color);font-size:.85rem}.empty{padding:1rem;background:var(--p-content-hover-background)}@media(max-width:700px){.page-shell{padding:2rem 1rem}.service-grid{grid-template-columns:1fr}}`], changeDetection: ChangeDetectionStrategy.OnPush })
export class ServicesComponent {
  private readonly data = inject(DataService);
  readonly services = toSignal(this.data.getServices(), { initialValue: [] });
  readonly search = signal('');
  readonly filtered = computed(() => { const term = this.search().toLowerCase().trim(); return this.services().filter((service) => service.question_count > 0 && (!term || `${service.name} ${service.short_name} ${service.category}`.toLowerCase().includes(term))); });
}
