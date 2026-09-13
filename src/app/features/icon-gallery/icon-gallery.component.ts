// src/app/features/icon-gallery/icon-gallery.component.ts

import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';

import { DataService } from '../../core/services/data.service';
import { AwsService } from '../../core/models/aws-service.model';
import { AwsServiceIconComponent } from '../../shared/components/aws-service-icon/aws-service-icon.component';

interface CategoryOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-icon-gallery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    SelectModule,
    CardModule,
    TagModule,
    ProgressSpinnerModule,
    MessageModule,
    TooltipModule,
    BadgeModule,
    AwsServiceIconComponent,
  ],
  templateUrl: './icon-gallery.component.html',
  styleUrl: './icon-gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconGalleryComponent implements OnInit {
  private readonly dataService = inject(DataService);

  readonly services = signal<AwsService[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly searchQuery = signal('');
  readonly selectedCategory = signal<string>('');

  readonly categories = computed<CategoryOption[]>(() => {
    const cats = [...new Set(this.services().map(s => s.category))].sort();
    return [
      { label: 'All Categories', value: '' },
      ...cats.map(c => ({ label: c, value: c })),
    ];
  });

  readonly filteredServices = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.services().filter(s => {
      const matchesCat = !cat || s.category === cat;
      const matchesQuery =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.short_name.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query) ||
        s.icon_key.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query);
      return matchesCat && matchesQuery;
    });
  });

  readonly totalCount = computed(() => this.services().length);
  readonly filteredCount = computed(() => this.filteredServices().length);

  ngOnInit(): void {
    this.dataService.getServices().subscribe({
      next: services => {
        this.services.set(services);
        this.loading.set(false);
      },
      error: err => {
        this.error.set('Failed to load services data. Please try again.');
        this.loading.set(false);
        console.error('[IconGallery]', err);
      },
    });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onCategoryChange(value: string): void {
    this.selectedCategory.set(value ?? '');
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
  }
}
