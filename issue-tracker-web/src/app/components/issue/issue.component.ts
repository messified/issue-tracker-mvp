import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';

import { IssueService } from '../../services/issue.service';
import { Issue, IssueStatus } from '../../models/issue.model';

@Component({
    selector: 'app-issue',
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatInputModule
    ],
    templateUrl: './issue.component.html',
    styleUrl: './issue.component.scss'
})
export class IssueComponent implements OnInit, AfterViewInit {

  displayedColumns = [
    'id',
    'title',
    'status',
    'priority',
    'assigneeId',
    'updatedAt'
  ];

  dataSource = new MatTableDataSource<Issue>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private issueService: IssueService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadIssues();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Client-side text search (until server-side paging)
    this.dataSource.filterPredicate = (issue, filter) => {
      const value = filter.toLowerCase();
      return (
        issue.title.toLowerCase().includes(value) ||
        issue.status.toLowerCase().includes(value) ||
        String(issue.priority).includes(value)
      );
    };
  }

  loadIssues(): void {
    this.issueService.getIssues().subscribe({
      next: issues => {
        this.dataSource.data = issues;
      }
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  goToIssue(issue: Issue): void {
    this.router.navigate(['/issues', issue.id]);
  }
}
