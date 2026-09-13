// src/app/app.routes.ts

import { CanDeactivateFn, Routes } from '@angular/router';
const sessionLeaveGuard: CanDeactivateFn<{ canLeave: () => Promise<boolean> }> = component => component.canLeave();

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    pathMatch: 'full',
    title: 'AWS SAA Practice',
  },
  {
    path: 'practice',
    loadComponent: () => import('./features/practice/practice.component').then(m => m.PracticeComponent),
    title: 'Practice — AWS SAA App',
  },
  {
    path: 'exam',
    loadComponent: () => import('./features/practice/practice.component').then(m => m.PracticeComponent),
    title: 'Exam — AWS SAA App',
  },
  {
    path: 'practice/session',
    canDeactivate: [sessionLeaveGuard],
    loadComponent: () => import('./features/quiz-session/quiz-session.component').then(m => m.QuizSessionComponent),
    title: 'Quiz Session — AWS SAA App',
  },
  {
    path: 'exam/session',
    canDeactivate: [sessionLeaveGuard],
    loadComponent: () => import('./features/quiz-session/quiz-session.component').then(m => m.QuizSessionComponent),
    title: 'Exam Session — AWS SAA App',
  },
  {
    path: 'services',
    loadComponent: () => import('./features/services/services.component').then(m => m.ServicesComponent),
    title: 'Services — AWS SAA App',
  },
  {
    path: 'results',
    loadComponent: () => import('./features/results/results.component').then(m => m.ResultsComponent),
    title: 'Results — AWS SAA App',
  },
  {
    path: 'review',
    loadComponent: () => import('./features/review/review.component').then(m => m.ReviewComponent),
    title: 'Review — AWS SAA App',
  },
  {
    path: 'icon-gallery',
    loadComponent: () =>
      import('./features/icon-gallery/icon-gallery.component').then(
        m => m.IconGalleryComponent
      ),
    title: 'Icon Gallery — AWS SAA App',
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
