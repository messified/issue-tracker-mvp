
// src/app/features/projects/project/project.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { PaginationParams } from '../../models/pagination.model';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './project.component.html',
  styleUrl: './project.component.scss'
})
export class ProjectComponent implements OnInit {
  // Signals for reactive state management
  projects = signal<Project[]>([]);
  loading = signal(false);
  totalProjects = signal(0);
  
  // Pagination state
  currentPage = signal(0);
  pageSize = signal(25);
  pageSizeOptions = [10, 25, 50, 100];
  
  // Sorting state
  sortBy = signal<string>('createdAt');
  sortOrder = signal<'asc' | 'desc'>('desc');
  
  // Search state
  searchTerm = signal('');
  private searchSubject = new Subject<string>();
  
  // Table configuration
  displayedColumns = ['id', 'name', 'ownerId', 'issueCount', 'memberCount', 'createdAt', 'actions'];
  
  // Computed values
  totalPages = computed(() => Math.ceil(this.totalProjects() / this.pageSize()));
  hasProjects = computed(() => this.projects().length > 0);
  isEmpty = computed(() => !this.loading() && this.projects().length === 0);

  constructor(
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.loadProjects();
  }

  /**
   * Setup debounced search to avoid excessive API calls
   */
  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.currentPage.set(0); // Reset to first page on search
      this.loadProjects();
    });
  }

  /**
   * Load projects with server-side pagination and sorting
   */
  loadProjects(): void {
    this.loading.set(true);

    const params: PaginationParams = {
      page: this.currentPage() + 1, // Backend expects 1-indexed pages
      pageSize: this.pageSize(),
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder()
    };

    this.projectService.getProjects(params).subscribe({
      next: (response) => {
        this.projects.set(response.data);
        this.totalProjects.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.loading.set(false);
      }
    });
  }

  /**
   * Handle page change from paginator
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadProjects();
  }

  /**
   * Handle sort change from table headers
   */
  onSortChange(sort: Sort): void {
    if (sort.active && sort.direction) {
      this.sortBy.set(sort.active);
      this.sortOrder.set(sort.direction as 'asc' | 'desc');
      this.currentPage.set(0); // Reset to first page on sort
      this.loadProjects();
    }
  }

  /**
   * Handle search input with debouncing
   */
  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value.trim().toLowerCase());
  }

  /**
   * Navigate to project detail view
   */
  viewProject(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  /**
   * Create new project
   */
  createProject(): void {
    // This would typically open a dialog
    // For now, navigate to create page or open dialog
    console.log('Create project clicked');
    // TODO: Implement create project dialog
  }

  /**
   * Edit project
   */
  editProject(project: Project, event: Event): void {
    event.stopPropagation(); // Prevent row click
    console.log('Edit project:', project);
    // TODO: Implement edit project dialog
  }

  /**
   * Delete project
   */
  deleteProject(project: Project, event: Event): void {
    event.stopPropagation(); // Prevent row click
    
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      this.projectService.deleteProject(project.id).subscribe({
        next: () => {
          this.loadProjects();
        },
        error: (error) => {
          console.error('Error deleting project:', error);
        }
      });
    }
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Shorten UUID for display
   */
  shortenId(id: string): string {
    return id.substring(0, 8) + '...';
  }
}