// src/app/shared/components/aws-service-icon/aws-service-icon.component.spec.ts

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AwsServiceIconComponent } from './aws-service-icon.component';
import { IconManifestService } from '../../../core/services/icon-manifest.service';
import { DataService } from '../../../core/services/data.service';
import { AwsIconManifest } from '../../../core/models/aws-icon-manifest.model';
import { By } from '@angular/platform-browser';

const MOCK_MANIFEST: AwsIconManifest = {
  'amazon-ec2': { file: 'Compute/Amazon-EC2.svg', name: 'Amazon EC2' },
};

describe('AwsServiceIconComponent', () => {
  let httpMock: HttpTestingController;

  function createFixture(iconKey: string, alt = '', size = 48): ComponentFixture<AwsServiceIconComponent> {
    const fixture = TestBed.createComponent(AwsServiceIconComponent);
    fixture.componentRef.setInput('iconKey', iconKey);
    fixture.componentRef.setInput('alt', alt);
    fixture.componentRef.setInput('size', size);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AwsServiceIconComponent],
      providers: [
        IconManifestService,
        DataService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Drain any pending manifest request left by tests that don't flush it
    httpMock.match('/data/aws-icon-manifest.json').forEach(req => req.flush({}));
    httpMock.verify();
  });

  function flushManifest(data: AwsIconManifest = MOCK_MANIFEST) {
    const req = httpMock.expectOne('/data/aws-icon-manifest.json');
    req.flush(data);
  }

  it('should create', () => {
    const fixture = createFixture('amazon-ec2');
    flushManifest();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render fallback before manifest loads', () => {
    const fixture = createFixture('amazon-ec2');
    // Do not flush — manifest pending
    const fallback = fixture.debugElement.query(By.css('.aws-service-icon--fallback'));
    expect(fallback).toBeTruthy();
  });

  it('should render <img> after manifest loads with known key', fakeAsync(() => {
    const fixture = createFixture('amazon-ec2', 'Amazon EC2');
    flushManifest();
    tick();
    TestBed.flushEffects();
    fixture.detectChanges();

    const img = fixture.debugElement.query(By.css('img.aws-service-icon'));
    expect(img).toBeTruthy();
    expect(img.nativeElement.src).toContain('Compute/Amazon-EC2.svg');
    expect(img.nativeElement.alt).toBe('Amazon EC2');
  }));

  it('should render fallback for unknown icon_key after manifest loads', fakeAsync(() => {
    const fixture = createFixture('unknown-key');
    flushManifest();
    tick();
    TestBed.flushEffects();
    fixture.detectChanges();

    const fallback = fixture.debugElement.query(By.css('.aws-service-icon--fallback'));
    expect(fallback).toBeTruthy();
    expect(fixture.debugElement.query(By.css('img.aws-service-icon'))).toBeNull();
  }));

  it('should set aria-hidden when alt is empty (decorative)', fakeAsync(() => {
    const fixture = createFixture('amazon-ec2', '');
    flushManifest();
    tick();
    TestBed.flushEffects();
    fixture.detectChanges();

    const img = fixture.debugElement.query(By.css('img'));
    expect(img.nativeElement.getAttribute('aria-hidden')).toBe('true');
    expect(img.nativeElement.alt).toBe('');
  }));

  it('should apply custom size', fakeAsync(() => {
    const fixture = createFixture('amazon-ec2', 'EC2', 96);
    flushManifest();
    tick();
    TestBed.flushEffects();
    fixture.detectChanges();

    const img = fixture.debugElement.query(By.css('img'));
    expect(img.nativeElement.style.width).toBe('96px');
    expect(img.nativeElement.style.height).toBe('96px');
  }));
});
