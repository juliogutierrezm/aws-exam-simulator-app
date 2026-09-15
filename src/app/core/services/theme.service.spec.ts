import { TestBed } from '@angular/core/testing';
import { LocalProgressService } from './local-progress.service';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [LocalProgressService, ThemeService] });
    service = TestBed.inject(ThemeService);
  });

  it('persists light and removes dark mode', () => {
    service.setPreference('light');
    expect(service.preference()).toBe('light');
    expect(document.documentElement.classList.contains('dark-mode')).toBeFalse();
  });

  it('applies dark mode', () => {
    service.setPreference('dark');
    expect(service.preference()).toBe('dark');
    expect(document.documentElement.classList.contains('dark-mode')).toBeTrue();
  });

  it('keeps light as the default preference', () => {
    expect(service.preference()).toBe('light');
    expect(document.documentElement.classList.contains('dark-mode')).toBeFalse();
  });
});
