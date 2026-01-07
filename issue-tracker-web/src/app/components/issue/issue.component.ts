import { Component, OnInit, OnDestroy, Input, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { IssueService } from '../../services/issue.service';
import { WebSocketService } from '../../services/websocket.service';
import { 
  Issue, 
  IssueStatus, 
  IssuePriority, 
  IssueFilters 
} from '../../models/issue.model';
import { WebSocketMessageType } from '../../models/websocket.model';
import { CreateIssueDialogComponent } from '../create-issue-dialog/create-issue-dialog.component';

@Component({
  selector: 'app-issue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
    MatDialogModule
  ],
  templateUrl: './issue.component.html',
  styleUrl: './issue.component.scss'
})
export class IssueComponent implements OnInit, OnDestroy {
  @Input() projectId?: string; // Allow projectId as input for project detail view
  
  // Signals for reactive state
  issues = signal<Issue[]>([]);
  loading = signal(false);
  totalIssues = signal(0);
  projectIdSignal = signal<string>('');
  
  // Pagination state
  currentPage = signal(0);
  pageSize = signal(25);
  pageSizeOptions = [10, 25, 50, 100];
  
  // Sorting state
  sortBy = signal<string>('updatedAt');
  sortOrder = signal<'asc' | 'desc'>('desc');
  
  // Filter state
  filters = signal<IssueFilters>({
    status: [],
    priority: []
  });
  
  // Search state
  searchText = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Enum references for template
  IssueStatus = IssueStatus;
  IssuePriority = IssuePriority;
  
  // Available filter options
  statusOptions = [
    { value: IssueStatus.OPEN, label: 'Open' },
    { value: IssueStatus.IN_PROGRESS, label: 'In Progress' },
    { value: IssueStatus.CLOSED, label: 'Closed' }
  ];
  
  priorityOptions = [
    { value: IssuePriority.LOW, label: 'Low' },
    { value: IssuePriority.MEDIUM, label: 'Medium' },
    { value: IssuePriority.HIGH, label: 'High' },
    { value: IssuePriority.CRITICAL, label: 'Critical' }
  ];
  
  // Table configuration
  displayedColumns = [
    'id',
    'title',
    'status',
    'priority',
    'assignee',
    'tags',
    'updatedAt',
    'actions'
  ];
  
  // Computed values
  totalPages = computed(() => Math.ceil(this.totalIssues() / this.pageSize()));
  hasIssues = computed(() => this.issues().length > 0);
  isEmpty = computed(() => !this.loading() && this.issues().length === 0);
  hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(
      f.status?.length ||
      f.priority?.length ||
      f.assigneeId ||
      f.tag ||
      f.search
    );
  });

  constructor(
    private issueService: IssueService,
    private wsService: WebSocketService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Get projectId from input, route param, or parent route
    const projectId = this.projectId 
      || this.route.snapshot.paramMap.get('projectId')
      || this.route.parent?.snapshot.paramMap.get('id');
    
    if (projectId) {
      this.projectIdSignal.set(projectId);
      this.setupSearch();
      this.setupWebSocket();
      this.loadIssues();
    } else {
      console.error('No projectId found');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup debounced search for title text search (per spec)
   */
  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.filters.update(f => ({ ...f, search: searchTerm || undefined }));
        this.currentPage.set(0);
        this.loadIssues();
      });
  }

  /**
   * Setup WebSocket for real-time updates (per spec)
   */
  private setupWebSocket(): void {
    this.wsService.connect();
    this.wsService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (
          message.type === WebSocketMessageType.ISSUE_CREATED ||
          message.type === WebSocketMessageType.ISSUE_UPDATED ||
          message.type === WebSocketMessageType.ISSUE_DELETED
        ) {
          if (message.payload.projectId === this.projectIdSignal()) {
            this.loadIssues();
          }
        }
      });
  }

  /**
   * Load issues with server-side pagination and filtering (per spec)
   */
  loadIssues(): void {
    if (!this.projectIdSignal()) return;

    this.loading.set(true);

    this.issueService.getIssues(
      this.projectIdSignal(),
      this.filters(),
      {
        page: this.currentPage() + 1, // Backend expects 1-indexed
        pageSize: this.pageSize(),
        sortBy: this.sortBy(),
        sortOrder: this.sortOrder()
      }
    ).subscribe({
      next: (response) => {
        this.issues.set(response.data);
        this.totalIssues.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading issues:', error);
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
    this.loadIssues();
  }

  /**
   * Handle sort change from table headers
   */
  onSortChange(sort: Sort): void {
    if (sort.active && sort.direction) {
      this.sortBy.set(sort.active);
      this.sortOrder.set(sort.direction as 'asc' | 'desc');
      this.currentPage.set(0);
      this.loadIssues();
    }
  }

  /**
   * Handle search input (debounced)
   */
  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchText = value;
    this.searchSubject.next(value.trim());
  }

  /**
   * Handle status filter change
   */
  onStatusFilterChange(statuses: IssueStatus[]): void {
    this.filters.update(f => ({ ...f, status: statuses }));
    this.currentPage.set(0);
    this.loadIssues();
  }

  /**
   * Handle priority filter change
   */
  onPriorityFilterChange(priorities: IssuePriority[]): void {
    this.filters.update(f => ({ ...f, priority: priorities }));
    this.currentPage.set(0);
    this.loadIssues();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters.set({ status: [], priority: [] });
    this.searchText = '';
    this.currentPage.set(0);
    this.loadIssues();
  }

  /**
   * Open create issue dialog
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateIssueDialogComponent, {
      width: '600px',
      data: { projectId: this.projectIdSignal() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadIssues();
      }
    });
  }

  /**
   * Navigate to issue detail view
   */
  viewIssue(issue: Issue): void {
    const projectId = this.projectIdSignal();
    if (projectId) {
      this.router.navigate(['/projects', projectId, 'issues', issue.id]);
    } else {
      this.router.navigate(['/issues', issue.id]);
    }
  }

  /**
   * Quick status update
   */
  quickUpdateStatus(issue: Issue, newStatus: IssueStatus, event: Event): void {
    event.stopPropagation();
    
    this.issueService.updateStatus(issue.id, newStatus, issue.version).subscribe({
      next: () => {
        this.loadIssues();
      },
      error: (err) => {
        if (err.status === 409) {
          alert('This issue was modified by another user. Refreshing...');
          this.loadIssues();
        }
      }
    });
  }

  /**
   * Format status for display
   */
  formatStatus(status: IssueStatus): string {
    return status.replace('_', ' ');
  }

  /**
   * Get priority icon
   */
  getPriorityIcon(priority: IssuePriority): string {
    const icons: Record<IssuePriority, string> = {
      [IssuePriority.LOW]: 'arrow_downward',
      [IssuePriority.MEDIUM]: 'remove',
      [IssuePriority.HIGH]: 'arrow_upward',
      [IssuePriority.CRITICAL]: 'priority_high'
    };
    return icons[priority];
  }

  /**
   * Get priority color class
   */
  getPriorityClass(priority: IssuePriority): string {
    return `priority-${priority.toLowerCase()}`;
  }

  /**
   * Get status color class
   */
  getStatusClass(status: IssueStatus): string {
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }

  /**
   * Shorten UUID for display
   */
  shortenId(id: string): string {
    return `#${id.substring(0, 8)}`;
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}