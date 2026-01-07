import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Issue, 
  CreateIssueRequest, 
  UpdateIssueRequest,
  IssueFilters,
  IssueComment,
  IssueActivity
} from '../models/issue.model';
import { PaginatedResponse, PaginationParams } from '../models/pagination.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IssueService {
  // Use environment variable for API URL
  private readonly apiUrl = `${environment.apiUrl}/issues`;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated and filtered list of issues
   * Implements server-side pagination & filtering per spec:
   * - status, priority, assigneeId, tag filters
   * - text search on title
   */
  getIssues(
    projectId: string,
    filters?: IssueFilters,
    pagination?: PaginationParams
  ): Observable<PaginatedResponse<Issue>> {
    let params = new HttpParams().set('projectId', projectId);

    // Add pagination params
    if (pagination) {
      params = params
        .set('page', pagination.page.toString())
        .set('pageSize', pagination.pageSize.toString());
      
      if (pagination.sortBy) {
        params = params.set('sortBy', pagination.sortBy);
      }
      if (pagination.sortOrder) {
        params = params.set('sortOrder', pagination.sortOrder);
      }
    }

    // Add filter params
    if (filters) {
      // Status filter - can be multiple values
      if (filters.status && filters.status.length > 0) {
        params = params.set('status', filters.status.join(','));
      }
      
      // Priority filter - can be multiple values
      if (filters.priority && filters.priority.length > 0) {
        params = params.set('priority', filters.priority.join(','));
      }
      
      // Assignee filter
      if (filters.assigneeId) {
        params = params.set('assigneeId', filters.assigneeId);
      }
      
      // Tag filter
      if (filters.tag) {
        params = params.set('tag', filters.tag);
      }
      
      // Text search on title (per spec requirement)
      if (filters.search) {
        params = params.set('search', filters.search);
      }
    }

    return this.http.get<PaginatedResponse<Issue>>(this.apiUrl, { params });
  }

  /**
   * Get single issue by ID
   * ID is string (UUID) per spec
   */
  getIssue(id: string): Observable<Issue> {
    return this.http.get<Issue>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new issue
   * Uses typed request per spec requirements:
   * Issue { id, projectId, title, description, status, priority, assigneeId, tags[], createdAt, updatedAt }
   */
  createIssue(data: CreateIssueRequest): Observable<Issue> {
    return this.http.post<Issue>(this.apiUrl, data);
  }

  /**
   * Update existing issue
   * Includes version for optimistic concurrency control (per spec constraint)
   * Will return 409 Conflict if version mismatch
   */
  updateIssue(id: string, data: UpdateIssueRequest): Observable<Issue> {
    return this.http.put<Issue>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete issue
   */
  deleteIssue(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get comments for an issue
   * Per spec requirement: "comment thread"
   */
  getComments(issueId: string): Observable<IssueComment[]> {
    return this.http.get<IssueComment[]>(`${this.apiUrl}/${issueId}/comments`);
  }

  /**
   * Add comment to issue
   * Per spec requirement: "comment thread"
   */
  addComment(issueId: string, content: string): Observable<IssueComment> {
    return this.http.post<IssueComment>(
      `${this.apiUrl}/${issueId}/comments`, 
      { content }
    );
  }

  /**
   * Update comment
   */
  updateComment(issueId: string, commentId: string, content: string): Observable<IssueComment> {
    return this.http.put<IssueComment>(
      `${this.apiUrl}/${issueId}/comments/${commentId}`,
      { content }
    );
  }

  /**
   * Delete comment
   */
  deleteComment(issueId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${issueId}/comments/${commentId}`);
  }

  /**
   * Get activity log for an issue
   * Per spec requirement: "activity log"
   */
  getActivity(issueId: string): Observable<IssueActivity[]> {
    return this.http.get<IssueActivity[]>(`${this.apiUrl}/${issueId}/activity`);
  }

  /**
   * Assign issue to user
   */
  assignIssue(issueId: string, assigneeId: string): Observable<Issue> {
    return this.updateIssue(issueId, { assigneeId });
  }

  /**
   * Unassign issue
   */
  unassignIssue(issueId: string): Observable<Issue> {
    return this.updateIssue(issueId, { assigneeId: undefined });
  }

  /**
   * Update issue status
   */
  updateStatus(issueId: string, status: string, version?: number): Observable<Issue> {
    return this.updateIssue(issueId, { status: status as any, version });
  }

  /**
   * Update issue priority
   */
  updatePriority(issueId: string, priority: string, version?: number): Observable<Issue> {
    return this.updateIssue(issueId, { priority: priority as any, version });
  }

  /**
   * Add tags to issue
   */
  addTags(issueId: string, tags: string[], version?: number): Observable<Issue> {
    return this.http.post<Issue>(`${this.apiUrl}/${issueId}/tags`, { tags, version });
  }

  /**
   * Remove tag from issue
   */
  removeTag(issueId: string, tag: string, version?: number): Observable<Issue> {
    return this.http.delete<Issue>(`${this.apiUrl}/${issueId}/tags/${tag}`, {
      body: { version }
    });
  }
}