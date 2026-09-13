// src/app/app.ts

import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionActionsService } from './core/services/session-actions.service';
import { SessionDialogComponent } from './shared/components/session-dialog/session-dialog.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SessionDialogComponent],
  template: `<header class="app-header"><a class="brand" routerLink="/">AWS <span>SAA</span></a><nav aria-label="Navegación principal"><a routerLink="/practice" routerLinkActive="active">Practice</a><a routerLink="/exam" routerLinkActive="active">Exam</a><a routerLink="/services" routerLinkActive="active">Services</a><a routerLink="/review" routerLinkActive="active">Review</a></nav><div class="theme-controls" aria-label="Tema"><button type="button" [class.active]="theme.preference() === 'light'" (click)="theme.setPreference('light')">Light</button><button type="button" [class.active]="theme.preference() === 'dark'" (click)="theme.setPreference('dark')">Dark</button><button type="button" [class.active]="theme.preference() === 'system'" (click)="theme.setPreference('system')">System</button></div></header><router-outlet />@defer (when actions.request()) { <app-session-dialog /> }`,
  styles: [':host { display: block; min-height: 100vh; } .app-header { display:flex; align-items:center; gap:2rem; max-width:1180px; margin:auto; padding:1.25rem 1.5rem; border-bottom:1px solid var(--p-surface-border); } .brand { color:var(--p-text-color); font-weight:900; letter-spacing:.06em; text-decoration:none; } .brand span { color:var(--p-primary-color); } nav { display:flex; gap:1.25rem; flex:1; } nav a { color:var(--p-text-muted-color); text-decoration:none; font-weight:700; } nav a.active, nav a:hover { color:var(--p-primary-color); } .theme-controls { display:flex; gap:.2rem; } .theme-controls button { padding:.35rem .5rem; color:var(--p-text-muted-color); background:transparent; border:0; cursor:pointer; font:inherit; font-size:.75rem; } .theme-controls button.active { color:var(--p-primary-color); font-weight:800; } @media(max-width:650px){.app-header{flex-wrap:wrap;gap:1rem;padding:1rem}.theme-controls{margin-left:auto}nav{order:3;flex-basis:100%;justify-content:space-between}}'],
})
export class App { readonly actions = inject(SessionActionsService); readonly theme = inject(ThemeService); }
