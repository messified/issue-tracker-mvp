import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectService } from '../../services/project.service';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../../models/project.model';

export interface CreateProjectDialogData {
  project?: Project; // If provided, we're editing
}

@Component({
  selector: 'app-create-project-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './create-project-dialog.component.html',
  styleUrl: './create-project-dialog.component.scss'
})
export class CreateProjectDialogComponent {
  projectForm: FormGroup;
  loading = signal(false);
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private dialogRef: MatDialogRef<CreateProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateProjectDialogData
  ) {
    this.isEditMode = !!data?.project;
    
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });

    if (this.isEditMode && data.project) {
      this.projectForm.patchValue({
        name: data.project.name,
        description: data.project.description || ''
      });
    }
  }

  getErrorMessage(fieldName: string): string {
    const control = this.projectForm.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return `${fieldName} is required`;
    }
    if (control.errors['minlength']) {
      return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    if (control.errors['maxlength']) {
      return `${fieldName} must be at most ${control.errors['maxlength'].requiredLength} characters`;
    }

    return '';
  }

  hasError(fieldName: string): boolean {
    const control = this.projectForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  getRemainingChars(fieldName: string, maxLength: number): number {
    const control = this.projectForm.get(fieldName);
    const currentLength = control?.value?.length || 0;
    return maxLength - currentLength;
  }

  onSubmit(): void {
    Object.keys(this.projectForm.controls).forEach(key => {
      this.projectForm.get(key)?.markAsTouched();
    });

    if (this.projectForm.invalid) {
      return;
    }

    this.loading.set(true);

    if (this.isEditMode && this.data.project) {
      const updateData: UpdateProjectRequest = this.projectForm.value;
      this.projectService.updateProject(this.data.project.id, updateData).subscribe({
        next: (project) => {
          this.dialogRef.close(project);
        },
        error: (error) => {
          console.error('Error updating project:', error);
          this.loading.set(false);
        }
      });
    } else {
      const createData: CreateProjectRequest = this.projectForm.value;
      this.projectService.createProject(createData).subscribe({
        next: (project) => {
          this.dialogRef.close(project);
        },
        error: (error) => {
          console.error('Error creating project:', error);
          this.loading.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
