import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { IssueService } from '../../services/issue.service';
import { Issue, IssueStatus } from '../../models/issue.model';
import { ActivityEntry } from '../../models/activity.model';

@Component({
    selector: 'app-issue-detail',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatInputModule,
        MatSelectModule,
        MatSnackBarModule
    ],
    templateUrl: './issue-detail.component.html',
    styleUrl: './issue-detail.component.scss'
})
export class IssueDetailComponent implements OnInit {

  issueId!: number;
  issue?: Issue;
  loading = true;
  editing = false;

  readonly statuses: IssueStatus[] = ['Open', 'InProgress', 'Closed'];

  activities: ActivityEntry[] = [];

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    status: ['Open' as IssueStatus, Validators.required],
    priority: [1, Validators.required],
    assigneeId: [null as number | null]
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private issueService: IssueService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.issueId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadIssue();
  }

  loadIssue(): void {
    this.issueService.getIssue(this.issueId).subscribe({
      next: issue => {
        this.issue = issue;
        this.form.patchValue(issue);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load issue', 'Dismiss', {
          duration: 3000
        });
      }
    });
  }

  startEdit(): void {
    this.editing = true;
  }

  cancelEdit(): void {
    if (this.issue) {
      this.form.patchValue(this.issue);
    }
    this.editing = false;
  }

  save(): void {
    if (this.form.invalid || !this.issue) {
      return;
    }

    const raw = this.form.getRawValue();

    const payload = {
      ...raw,
      assigneeId: raw.assigneeId ?? undefined
    };

    this.issueService.updateIssue(this.issueId, payload).subscribe({
      next: updated => {
        this.issue = updated;
        this.editing = false;

        this.addActivity('Issue updated');
        this.snackBar.open('Issue saved successfully', 'Dismiss', {
          duration: 3000
        });
      },
      error: () => {
        this.snackBar.open('Failed to save issue', 'Dismiss', {
          duration: 3000
        });
      }
    });
  }

  addActivity(message: string): void {
    this.activities.unshift({
      timestamp: new Date().toISOString(),
      message
    });
  }

  goBackToList(): void {
    this.router.navigate(['/issues']);
  }
}
