import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

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
export class IssueDetailComponent {

  issueId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.issueId = Number(this.route.snapshot.paramMap.get('id'));
  }

  goBackToList(): void {
    this.router.navigate(['/issues']);
  }

}
