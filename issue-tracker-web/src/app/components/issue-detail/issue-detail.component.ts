import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { Subject, takeUntil } from 'rxjs';

import { IssueService } from '../../services/issue.service';
import { WebSocketService } from '../../services/websocket.service';
import { 
  Issue, 
  IssueStatus, 
  IssuePriority,
  IssueComment,
  IssueActivity
} from '../../models/issue.model';
import { WebSocketMessageType } from '../../models/websocket.model';

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatSnackBarModule,
    MatTabsModule,
    MatListModule
  ],
  templateUrl: './issue-detail.component.html',
  styleUrl: './issue-detail.component.scss'
})
export class IssueDetailComponent implements OnInit, OnDestroy {
  // Signals for reactive state
  issue = signal<Issue | null>(null);
  comments = signal<IssueComment[]>([]);
  activities = signal<IssueActivity[]>([]);
  loading = signal(true);
  editMode = signal(false);
  submittingComment = signal(false);
  
  // IDs from route
  issueId!: string;
  projectId!: string;
  
  // Forms
  editForm!: FormGroup;
  commentForm!: FormGroup;
  
  // Enums for template
  IssueStatus = IssueStatus;
  IssuePriority = IssuePriority;
  
  // Status and Priority options
  readonly statusOptions = [
    { value: IssueStatus.OPEN, label: 'Open', icon: 'radio_button_unchecked', color: 'open' },
    { value: IssueStatus.IN_PROGRESS, label: 'In Progress', icon: 'pending', color: 'in-progress' },
    { value: IssueStatus.CLOSED, label: 'Closed', icon: 'check_circle', color: 'closed' }
  ];
  
  readonly priorityOptions = [
    { value: IssuePriority.LOW, label: 'Low', icon: 'arrow_downward', color: 'low' },
    { value: IssuePriority.MEDIUM, label: 'Medium', icon: 'remove', color: 'medium' },
    { value: IssuePriority.HIGH, label: 'High', icon: 'arrow_upward', color: 'high' },
    { value: IssuePriority.CRITICAL, label: 'Critical', icon: 'priority_high', color: 'critical' }
  ];
  
  // Computed values
  hasComments = computed(() => this.comments().length > 0);
  hasActivities = computed(() => this.activities().length > 0);
  canEdit = computed(() => {
    const issue = this.issue();
    // Add your authorization logic here
    // For now, allow editing for all authenticated users
    return !!issue;
  });
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private issueService: IssueService,
    private wsService: WebSocketService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    // Get IDs from route
    this.issueId = this.route.snapshot.paramMap.get('issueId') || this.route.snapshot.paramMap.get('id')!;
    this.projectId = this.route.snapshot.paramMap.get('projectId') || this.route.parent?.snapshot.paramMap.get('id')!;
    
    if (!this.issueId) {
      console.error('No issueId found in route');
      this.goBack();
      return;
    }
    
    this.loadIssue();
    this.loadComments();
    this.loadActivities();
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize forms
   */
  private initForms(): void {
    // Edit form for issue details
    this.editForm = this.fb.nonNullable.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      status: [IssueStatus.OPEN, Validators.required],
      priority: [IssuePriority.MEDIUM, Validators.required],
      tags: [[]] as [string[]]
    });
    
    // Comment form
    this.commentForm = this.fb.nonNullable.group({
      content: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(2000)]]
    });
  }
  
  /**
   * Type-safe form control getters
   */
  get titleControl(): FormControl {
    return this.editForm.get('title') as FormControl;
  }
  
  get descriptionControl(): FormControl {
    return this.editForm.get('description') as FormControl;
  }
  
  get statusControl(): FormControl {
    return this.editForm.get('status') as FormControl;
  }
  
  get priorityControl(): FormControl {
    return this.editForm.get('priority') as FormControl;
  }
  
  get contentControl(): FormControl {
    return this.commentForm.get('content') as FormControl;
  }

  /**
   * Load issue details
   */
  loadIssue(): void {
    this.loading.set(true);
    this.issueService.getIssue(this.issueId).subscribe({
      next: (issue) => {
        this.issue.set(issue);
        this.editForm.patchValue({
          title: issue.title,
          description: issue.description,
          status: issue.status,
          priority: issue.priority,
          tags: issue.tags
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading issue:', error);
        this.loading.set(false);
        this.snackBar.open('Failed to load issue', 'Close', { duration: 5000 });
        this.goBack();
      }
    });
  }

  /**
   * Load comments (per spec: "comment thread")
   */
  loadComments(): void {
    this.issueService.getComments(this.issueId).subscribe({
      next: (comments) => {
        this.comments.set(comments);
      },
      error: (error) => {
        console.error('Error loading comments:', error);
      }
    });
  }

  /**
   * Load activity log (per spec: "activity log")
   */
  loadActivities(): void {
    this.issueService.getActivity(this.issueId).subscribe({
      next: (activities) => {
        this.activities.set(activities);
      },
      error: (error) => {
        console.error('Error loading activities:', error);
      }
    });
  }

  /**
   * Setup WebSocket for real-time updates (per spec: "Real-time")
   */
  private setupWebSocket(): void {
    this.wsService.onIssueUpdates(this.issueId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('WebSocket update:', message.type);
        
        switch (message.type) {
          case WebSocketMessageType.ISSUE_UPDATED:
            this.loadIssue();
            this.loadActivities();
            this.showNotification('Issue was updated');
            break;
            
          case WebSocketMessageType.COMMENT_ADDED:
            this.loadComments();
            this.showNotification('New comment added');
            break;
            
          case WebSocketMessageType.COMMENT_UPDATED:
            this.loadComments();
            break;
        }
      });
  }

  /**
   * Toggle edit mode
   */
  toggleEditMode(): void {
    if (this.editMode()) {
      // Cancel edit - reset form
      const issue = this.issue();
      if (issue) {
        this.editForm.patchValue({
          title: issue.title,
          description: issue.description,
          status: issue.status,
          priority: issue.priority
        });
      }
    }
    this.editMode.set(!this.editMode());
  }

  /**
   * Save changes (per spec: "optimistic concurrency on issue edits")
   */
  saveChanges(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      return;
    }

    const issue = this.issue();
    if (!issue) return;

    const updateData = {
      ...this.editForm.value,
      version: issue.version // Optimistic concurrency control
    };

    this.issueService.updateIssue(this.issueId, updateData).subscribe({
      next: (updated) => {
        this.issue.set(updated);
        this.editMode.set(false);
        this.snackBar.open('Issue updated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        if (error.status === 409) {
          // Conflict - optimistic concurrency failure
          this.snackBar.open(
            'Issue was modified by another user. Refreshing...', 
            'Close', 
            { duration: 5000 }
          ).afterDismissed().subscribe(() => {
            this.loadIssue();
            this.editMode.set(false);
          });
        } else {
          this.snackBar.open('Failed to update issue', 'Close', { duration: 5000 });
        }
      }
    });
  }

  /**
   * Add comment (per spec: "comment thread")
   */
  addComment(): void {
    if (this.commentForm.invalid) {
      return;
    }

    this.submittingComment.set(true);
    const content = this.commentForm.value.content;

    this.issueService.addComment(this.issueId, content).subscribe({
      next: (comment) => {
        this.comments.update(comments => [...comments, comment]);
        this.commentForm.reset();
        this.submittingComment.set(false);
        this.snackBar.open('Comment added', 'Close', { duration: 2000 });
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.submittingComment.set(false);
        this.snackBar.open('Failed to add comment', 'Close', { duration: 5000 });
      }
    });
  }

  /**
   * Quick status update
   */
  updateStatus(newStatus: IssueStatus): void {
    const issue = this.issue();
    if (!issue) return;

    this.issueService.updateStatus(this.issueId, newStatus, issue.version).subscribe({
      next: (updated) => {
        this.issue.set(updated);
        this.snackBar.open(`Status changed to ${this.formatStatus(newStatus)}`, 'Close', { duration: 2000 });
      },
      error: (error) => {
        if (error.status === 409) {
          this.snackBar.open('Issue was modified. Refreshing...', 'Close', { duration: 3000 });
          this.loadIssue();
        }
      }
    });
  }

  /**
   * Quick priority update
   */
  updatePriority(newPriority: IssuePriority): void {
    const issue = this.issue();
    if (!issue) return;

    this.issueService.updatePriority(this.issueId, newPriority, issue.version).subscribe({
      next: (updated) => {
        this.issue.set(updated);
        this.snackBar.open(`Priority changed to ${newPriority}`, 'Close', { duration: 2000 });
      },
      error: (error) => {
        if (error.status === 409) {
          this.snackBar.open('Issue was modified. Refreshing...', 'Close', { duration: 3000 });
          this.loadIssue();
        }
      }
    });
  }

  /**
   * Delete issue
   */
  deleteIssue(): void {
    if (!confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      return;
    }

    this.issueService.deleteIssue(this.issueId).subscribe({
      next: () => {
        this.snackBar.open('Issue deleted', 'Close', { duration: 3000 });
        this.goBack();
      },
      error: (error) => {
        console.error('Error deleting issue:', error);
        this.snackBar.open('Failed to delete issue', 'Close', { duration: 5000 });
      }
    });
  }

  /**
   * Navigate back
   */
  goBack(): void {
    if (this.projectId) {
      this.router.navigate(['/projects', this.projectId]);
    } else {
      this.router.navigate(['/projects']);
    }
  }

  /**
   * Format status for display
   */
  formatStatus(status: IssueStatus): string {
    return status.replace('_', ' ');
  }

  /**
   * Get status configuration
   */
  getStatusConfig(status: IssueStatus) {
    return this.statusOptions.find(s => s.value === status);
  }

  /**
   * Get priority configuration
   */
  getPriorityConfig(priority: IssuePriority) {
    return this.priorityOptions.find(p => p.value === priority);
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format activity message
   */
  formatActivity(activity: IssueActivity): string {
    if (activity.field) {
      return `changed ${activity.field} from "${activity.oldValue}" to "${activity.newValue}"`;
    }
    return activity.action;
  }

  /**
   * Get activity icon
   */
  getActivityIcon(action: string): string {
    const iconMap: Record<string, string> = {
      'created': 'add_circle',
      'updated': 'edit',
      'status_changed': 'flag',
      'priority_changed': 'priority_high',
      'assigned': 'person_add',
      'commented': 'comment',
      'deleted': 'delete'
    };
    return iconMap[action] || 'info';
  }

  /**
   * Shorten ID for display
   */
  shortenId(id: string): string {
    return `#${id.substring(0, 8)}`;
  }

  /**
   * Show notification
   */
  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  /**
   * Mark all form controls as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get form error message
   */
  getErrorMessage(fieldName: string): string {
    const control = this.editForm.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return `${fieldName} is required`;
    }
    if (control.errors['minlength']) {
      return `${fieldName} is too short`;
    }
    if (control.errors['maxlength']) {
      return `${fieldName} is too long`;
    }

    return 'Invalid value';
  }
}