import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private readonly baseUrl = '/api/projects';

  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.baseUrl);
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/${id}`);
  }

  createProject(project: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(this.baseUrl, project);
  }

  updateProject(id: number, project: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/${id}`, project);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
