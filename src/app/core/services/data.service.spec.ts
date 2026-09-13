// src/app/core/services/data.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DataService } from './data.service';
import { AwsService } from '../models/aws-service.model';
import { AwsIconManifest } from '../models/aws-icon-manifest.model';

describe('DataService', () => {
  let service: DataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load services.json', () => {
    const mockServices: AwsService[] = [
      {
        id: 'amazon-ec2',
        name: 'Amazon EC2',
        short_name: 'EC2',
        category: 'Compute',
        icon_key: 'amazon-ec2',
        question_count: 98,
        mentioned_question_count: 194,
      },
    ];

    service.getServices().subscribe(services => {
      expect(services.length).toBe(1);
      expect(services[0].id).toBe('amazon-ec2');
    });

    const req = httpMock.expectOne('/data/services.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockServices);
  });

  it('should cache services.json (only one HTTP request)', () => {
    service.getServices().subscribe();
    service.getServices().subscribe();

    const reqs = httpMock.match('/data/services.json');
    expect(reqs.length).toBe(1);
    reqs[0].flush([]);
  });

  it('should load questions.json', () => {
    service.getQuestions().subscribe(questions => {
      expect(Array.isArray(questions)).toBe(true);
    });
    const req = httpMock.expectOne('/data/questions.json');
    req.flush([]);
  });

  it('should load aws-icon-manifest.json', () => {
    const mockManifest: AwsIconManifest = {
      'amazon-ec2': { file: 'Compute/Amazon-EC2.svg', name: 'Amazon EC2' },
    };

    service.getIconManifest().subscribe(manifest => {
      expect(manifest['amazon-ec2']).toBeDefined();
      expect(manifest['amazon-ec2'].file).toBe('Compute/Amazon-EC2.svg');
    });

    const req = httpMock.expectOne('/data/aws-icon-manifest.json');
    req.flush(mockManifest);
  });

  it('should handle HTTP errors gracefully', () => {
    let errorEmitted = false;
    service.getServices().subscribe({
      error: () => (errorEmitted = true),
    });

    const req = httpMock.expectOne('/data/services.json');
    req.error(new ProgressEvent('error'));

    expect(errorEmitted).toBe(true);
  });
});
