// src/app/core/services/icon-manifest.service.spec.ts

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { IconManifestService } from './icon-manifest.service';
import { DataService } from './data.service';
import { AwsIconManifest } from '../models/aws-icon-manifest.model';

const MOCK_MANIFEST: AwsIconManifest = {
  'amazon-ec2': { file: 'Compute/Amazon-EC2.svg', name: 'Amazon EC2' },
  'amazon-s3': { file: 'Storage/Amazon-Simple-Storage-Service.svg', name: 'Amazon S3' },
};

describe('IconManifestService', () => {
  let service: IconManifestService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        IconManifestService,
        DataService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(IconManifestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Drain any pending manifest request that wasn't flushed in the test
    // (toSignal fires the HTTP call immediately on service construction)
    httpMock.match('/data/aws-icon-manifest.json').forEach(req => req.flush({}));
    httpMock.verify();
  });

  /** Helper: flush the manifest request with mock data and advance microtasks */
  function flushManifest(data: AwsIconManifest = MOCK_MANIFEST) {
    const req = httpMock.expectOne('/data/aws-icon-manifest.json');
    req.flush(data);
  }

  it('should be created', () => {
    flushManifest();
    expect(service).toBeTruthy();
  });

  it('should return null for resolveUrl while manifest has not resolved', fakeAsync(() => {
    // Do NOT flush — manifest is still pending
    // Drain in afterEach
    expect(service.resolveUrl('amazon-ec2')).toBeNull();
  }));

  it('should resolve known icon_key to SVG URL after manifest loads', fakeAsync(() => {
    flushManifest();
    tick();
    TestBed.flushEffects();

    expect(service.resolveUrl('amazon-ec2')).toBe('/aws-icons/Compute/Amazon-EC2.svg');
    expect(service.resolveUrl('amazon-s3')).toBe(
      '/aws-icons/Storage/Amazon-Simple-Storage-Service.svg'
    );
  }));

  it('should return null for unknown icon_key after manifest loads', fakeAsync(() => {
    flushManifest();
    tick();
    TestBed.flushEffects();

    expect(service.resolveUrl('unknown-service')).toBeNull();
    expect(service.resolveUrl('')).toBeNull();
  }));

  it('should return correct hasIcon values after manifest loads', fakeAsync(() => {
    flushManifest();
    tick();
    TestBed.flushEffects();

    expect(service.hasIcon('amazon-ec2')).toBe(true);
    expect(service.hasIcon('amazon-quicksight')).toBe(false);
  }));

  it('should return null gracefully when manifest HTTP request fails', fakeAsync(() => {
    const req = httpMock.expectOne('/data/aws-icon-manifest.json');
    req.error(new ProgressEvent('network error'));
    tick();
    TestBed.flushEffects();

    expect(() => service.resolveUrl('amazon-ec2')).not.toThrow();
    expect(service.resolveUrl('amazon-ec2')).toBeNull();
  }));
});
