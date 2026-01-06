export interface Project {
  id: string;                    // UUID string, not number
  name: string;
  description?: string;          // Optional per spec
  ownerId: string;               // Required per spec: Project { id, name, ownerId }
  owner?: User;                  // Populated for display
  memberCount?: number;          // Computed field for UI
  issueCount?: number;           // Computed field for UI
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMember {
  userId: string;
  projectId: string;
  role: UserRole;                // RBAC: Owner, Maintainer, Reporter
  user?: User;                   // Populated for display
  addedAt: Date;
}

// Spec requires RBAC with these three roles
export enum UserRole {
  OWNER = 'OWNER',              // Full control
  MAINTAINER = 'MAINTAINER',    // Can edit issues, manage members
  REPORTER = 'REPORTER'          // Can create issues, add comments
}

export interface User {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  createdAt: Date;
}

// Type-safe request interfaces instead of Partial<Project>
export interface CreateProjectRequest {
  name: string;                  // Required
  description?: string;          // Optional
}

export interface UpdateProjectRequest {
  name?: string;                 // All fields optional for updates
  description?: string;
}