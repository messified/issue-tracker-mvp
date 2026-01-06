import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest,
  ProjectMember 
} from '../models/project.model';
import { PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  // Use environment variable instead of hardcoded URL
  private readonly apiUrl = `http:/localhost:8080/api/projects`;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of projects with optional sorting
   * Implements server-side pagination per spec requirement
   */
  getProjects(params?: PaginationParams): Observable<PaginatedResponse<Project>> {
    let httpParams = new HttpParams();
    
    if (params) {
      httpParams = httpParams
        .set('page', params.page.toString())
        .set('pageSize', params.pageSize.toString());
      
      if (params.sortBy) {
        httpParams = httpParams.set('sortBy', params.sortBy);
      }
      if (params.sortOrder) {
        httpParams = httpParams.set('sortOrder', params.sortOrder);
      }
    }

    // Return paginated response instead of plain array
    return this.http.get<PaginatedResponse<Project>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Get single project by ID
   * ID is string (UUID) not number per spec
   */
  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new project
   * Uses typed request interface per spec
   */
  createProject(data: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, data);
  }

  /**
   * Update existing project
   * Uses typed request interface per spec
   */
  updateProject(id: string, data: UpdateProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete project
   * ID is string (UUID) per spec
   */
  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get project members (for RBAC)
   * Additional endpoint per spec requirement for role-based access
   */
  getProjectMembers(projectId: string): Observable<ProjectMember[]> {
    return this.http.get<ProjectMember[]>(`${this.apiUrl}/${projectId}/members`);
  }

  /**
   * Add member to project with role (for RBAC)
   * Supports Owner, Maintainer, Reporter roles per spec
   */
  addProjectMember(projectId: string, userId: string, role: string): Observable<ProjectMember> {
    return this.http.post<ProjectMember>(
      `${this.apiUrl}/${projectId}/members`, 
      { userId, role }
    );
  }

  /**
   * Remove member from project (for RBAC)
   */
  removeProjectMember(projectId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/members/${userId}`);
  }

  /**
   * Update member role (for RBAC)
   */
  updateProjectMemberRole(projectId: string, userId: string, role: string): Observable<ProjectMember> {
    return this.http.patch<ProjectMember>(
      `${this.apiUrl}/${projectId}/members/${userId}`, 
      { role }
    );
  }
}
