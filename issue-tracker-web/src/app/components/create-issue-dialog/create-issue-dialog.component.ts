import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { IssueService } from '../../services/issue.service';
import { IssuePriority } from '../../models/issue.model';

export interface CreateIssueDialogData {
  projectId: string;
}

@Component({
  selector: 'app-create-issue-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule
  ],
  templateUrl: './create-issue-dialog.component.html',
  styleUrl: './create-issue-dialog.component.scss'
})
export class CreateIssueDialogComponent {
  issueForm: FormGroup;
  loading = signal(false);
  tags = signal<string[]>([]);
  
  // Chip input configuration
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  
  // Priority options
  readonly priorities = [
    { value: IssuePriority.LOW, label: 'Low', icon: 'arrow_downward', color: 'low' },
    { value: IssuePriority.MEDIUM, label: 'Medium', icon: 'remove', color: 'medium' },
    { value: IssuePriority.HIGH, label: 'High', icon: 'arrow_upward', color: 'high' },
    { value: IssuePriority.CRITICAL, label: 'Critical', icon: 'priority_high', color: 'critical' }
  ];

  // Form validation messages
  readonly validationMessages = {
    title: {
      required: 'Title is required',
      minlength: 'Title must be at least 5 characters'
    },
    description: {
      required: 'Description is required',
      minlength: 'Description must be at least 10 characters'
    },
    priority: {
      required: 'Priority is required'
    }
  };

  constructor(
    private fb: FormBuilder,
    private issueService: IssueService,
    private dialogRef: MatDialogRef<CreateIssueDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateIssueDialogData
  ) {
    // Initialize form with validators
    this.issueForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
      priority: [IssuePriority.MEDIUM, Validators.required]
    });
  }

  /**
   * Add tag from chip input
   */
  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    
    // Validation
    if (!value) return;
    if (this.tags().length >= 10) {
      // Max 10 tags
      return;
    }
    if (value.length > 30) {
      // Max 30 chars per tag
      return;
    }
    if (this.tags().includes(value)) {
      // No duplicates
      return;
    }
    
    // Add tag
    this.tags.update(tags => [...tags, value]);
    
    // Clear input
    event.chipInput!.clear();
  }

  /**
   * Remove tag from list
   */
  removeTag(tag: string): void {
    this.tags.update(tags => tags.filter(t => t !== tag));
  }

  /**
   * Get error message for form field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.issueForm.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;
    const messages = this.validationMessages[fieldName as keyof typeof this.validationMessages];

    if (errors['required']) {
      return messages.required;
    }
    if (errors['minlength']) {
      return messages.required;
    }

    return '';
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string): boolean {
    const control = this.issueForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Get remaining characters for field
   */
  getRemainingChars(fieldName: string, maxLength: number): number {
    const control = this.issueForm.get(fieldName);
    const currentLength = control?.value?.length || 0;
    return maxLength - currentLength;
  }

  /**
   * Create issue
   */
  onCreate(): void {
    // Mark all fields as touched to show validation errors
    Object.keys(this.issueForm.controls).forEach(key => {
      this.issueForm.get(key)?.markAsTouched();
    });

    if (this.issueForm.invalid) {
      return;
    }

    this.loading.set(true);

    const issueData = {
      ...this.issueForm.value,
      projectId: this.data.projectId,
      tags: this.tags()
    };

    this.issueService.createIssue(issueData).subscribe({
      next: (issue) => {
        console.log('Issue created:', issue);
        this.dialogRef.close(issue); // Return created issue
      },
      error: (error) => {
        console.error('Error creating issue:', error);
        this.loading.set(false);
        // Error is handled by global error interceptor
      }
    });
  }

  /**
   * Cancel and close dialog
   */
  onCancel(): void {
    this.dialogRef.close(null);
  }

  /**
   * Get priority icon for selected value
   */
  getPriorityIcon(priority: IssuePriority): string {
    const option = this.priorities.find(p => p.value === priority);
    return option?.icon || 'help';
  }
}