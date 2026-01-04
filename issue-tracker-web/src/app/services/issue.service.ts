import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Issue, IssueStatus } from '../models/issue.model';

@Injectable({
  providedIn: 'root'
})
export class IssueService {

  private readonly baseUrl = '/api/issues';

  constructor(private http: HttpClient) {}

  getIssues(filters?: {
    projectId?: number;
    status?: IssueStatus;
    assigneeId?: number;
    tag?: string;
    search?: string;
  }): Observable<Issue[]> {

    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value);
        }
      });
    }

    return this.http.get<Issue[]>(this.baseUrl, { params });
  }

  getIssue(id: number): Observable<Issue> {
    return this.http.get<Issue>(`${this.baseUrl}/${id}`);
  }

  createIssue(issue: Partial<Issue>): Observable<Issue> {
    return this.http.post<Issue>(this.baseUrl, issue);
  }

  updateIssue(id: number, issue: Partial<Issue>): Observable<Issue> {
    return this.http.put<Issue>(`${this.baseUrl}/${id}`, issue);
  }

  deleteIssue(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
