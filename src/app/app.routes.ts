// src/app/app.routes.ts

import { CanDeactivateFn, Routes } from '@angular/router';
const sessionLeaveGuard: CanDeactivateFn<{ canLeave: () => Promise<boolean> }> = component => component.canLeave();

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    pathMatch: 'full',
    title: 'CloudCase Hub',
  },
  {
    path: 'practice',
    loadComponent: () => import('./features/practice/practice.component').then(m => m.PracticeComponent),
    title: 'Practice - CloudCase Hub',
  },
  {
    path: 'exam',
    loadComponent: () => import('./features/practice/practice.component').then(m => m.PracticeComponent),
    title: 'Exam - CloudCase Hub',
  },
  {
    path: 'practice/session',
    canDeactivate: [sessionLeaveGuard],
    loadComponent: () => import('./features/quiz-session/quiz-session.component').then(m => m.QuizSessionComponent),
    title: 'Quiz Session - CloudCase Hub',
  },
  {
    path: 'exam/session',
    canDeactivate: [sessionLeaveGuard],
    loadComponent: () => import('./features/quiz-session/quiz-session.component').then(m => m.QuizSessionComponent),
    title: 'Exam Session - CloudCase Hub',
  },
  {
    path: 'services',
    loadComponent: () => import('./features/services/services.component').then(m => m.ServicesComponent),
    title: 'Services - CloudCase Hub',
  },
  {
    path: 'results',
    loadComponent: () => import('./features/results/results.component').then(m => m.ResultsComponent),
    title: 'Results - CloudCase Hub',
  },
  {
    path: 'review',
    loadComponent: () => import('./features/review/review.component').then(m => m.ReviewComponent),
    title: 'Review - CloudCase Hub',
  },
  {
    path: 'icon-gallery',
    loadComponent: () =>
      import('./features/icon-gallery/icon-gallery.component').then(
        m => m.IconGalleryComponent
      ),
    title: 'Icon Gallery - CloudCase Hub',
  },
  {
    path: 'dev/icons',
    redirectTo: 'icon-gallery',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'icon-gallery',
  },
];
