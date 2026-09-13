// src/app/core/services/data.service.ts
// Central service for loading all JSON datasets from /data/.
// Caches each result so the HTTP request fires only once per session.

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, catchError, throwError } from 'rxjs';
import { Question } from '../models/question.model';
import { AwsService } from '../models/aws-service.model';
import { Concept } from '../models/concept.model';
import { ExamDomain } from '../models/exam-domain.model';
import { AwsIconManifest } from '../models/aws-icon-manifest.model';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);

  private questions$?: Observable<Question[]>;
  private services$?: Observable<AwsService[]>;
  private concepts$?: Observable<Concept[]>;
  private domains$?: Observable<ExamDomain[]>;
  private iconManifest$?: Observable<AwsIconManifest>;

  getQuestions(): Observable<Question[]> {
    this.questions$ ??= this.http
      .get<Question[]>('/data/questions.json')
      .pipe(shareReplay(1), catchError(this.handleError('questions.json')));
    return this.questions$;
  }

  getServices(): Observable<AwsService[]> {
    this.services$ ??= this.http
      .get<AwsService[]>('/data/services.json')
      .pipe(shareReplay(1), catchError(this.handleError('services.json')));
    return this.services$;
  }

  getConcepts(): Observable<Concept[]> {
    this.concepts$ ??= this.http
      .get<Concept[]>('/data/concepts.json')
      .pipe(shareReplay(1), catchError(this.handleError('concepts.json')));
    return this.concepts$;
  }

  getDomains(): Observable<ExamDomain[]> {
    this.domains$ ??= this.http
      .get<ExamDomain[]>('/data/domains.json')
      .pipe(shareReplay(1), catchError(this.handleError('domains.json')));
    return this.domains$;
  }

  getIconManifest(): Observable<AwsIconManifest> {
    this.iconManifest$ ??= this.http
      .get<AwsIconManifest>('/data/aws-icon-manifest.json')
      .pipe(shareReplay(1), catchError(this.handleError('aws-icon-manifest.json')));
    return this.iconManifest$;
  }

  private handleError(filename: string) {
    return (error: unknown): Observable<never> => {
      console.error(`[DataService] Failed to load ${filename}:`, error);
      return throwError(() => new Error(`Failed to load ${filename}`));
    };
  }
}
