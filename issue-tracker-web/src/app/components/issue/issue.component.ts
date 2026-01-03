import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';

export type IssueStatus = 'Open' | 'InProgress' | 'Closed';

export interface Issue {
  id: number;
  projectId: number;
  title: string;
  status: IssueStatus;
  priority: number;
  assigneeId?: number;
  updatedAt: string;
}

@Component({
  selector: 'app-issue',
  standalone: true,
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
export class IssueComponent implements AfterViewInit {

  displayedColumns = [
    'id',
    'title',
    'status',
    'priority',
    'assigneeId',
    'updatedAt'
  ];

  dataSource = new MatTableDataSource<Issue>([
    {
      id: 101,
      projectId: 1,
      title: 'Fix login redirect bug',
      status: 'Open',
      priority: 1,
      assigneeId: 42,
      updatedAt: '2026-01-01'
    },
    {
      id: 102,
      projectId: 1,
      title: 'Add pagination to issue list',
      status: 'InProgress',
      priority: 2,
      assigneeId: 42,
      updatedAt: '2026-01-02'
    },
    {
      id: 103,
      projectId: 2,
      title: 'Refactor API error handling',
      status: 'Closed',
      priority: 3,
      updatedAt: '2025-12-30'
    }
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private router: Router) {}

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Custom filter to support text search across multiple fields
    this.dataSource.filterPredicate = (issue, filter) => {
      const value = filter.toLowerCase();
      return (
        issue.title.toLowerCase().includes(value) ||
        issue.status.toLowerCase().includes(value) ||
        String(issue.priority).includes(value)
      );
    };
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  goToIssue(issue: Issue) {
    this.router.navigate(['/issues', issue.id]);
  }
}
