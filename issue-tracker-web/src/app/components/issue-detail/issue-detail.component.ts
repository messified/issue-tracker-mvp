import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { IssueService } from '../../services/issue.service';
import { Issue } from '../../models/issue.model';

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './issue-detail.component.html',
  styleUrl: './issue-detail.component.scss'
})
export class IssueDetailComponent implements OnInit {

  issueId!: number;
  issue?: Issue;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private issueService: IssueService
  ) {}

  ngOnInit(): void {
    this.issueId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadIssue();
  }

  loadIssue(): void {
    this.issueService.getIssue(this.issueId).subscribe({
      next: issue => {
        this.issue = issue;
        this.loading = false;
      }
    });
  }

  goBackToList(): void {
    this.router.navigate(['/issues']);
  }
}
