export interface Issue {
  id: string;                    // UUID string
  projectId: string;             // Required per spec
  title: string;                 // Required per spec
  description: string;           // Required per spec
  status: IssueStatus;           // Required per spec: [Open|InProgress|Closed]
  priority: IssuePriority;       // Required per spec
  assigneeId?: string;           // Optional per spec
  assignee?: User;               // Populated for display
  reporterId: string;            // User who created the issue
  reporter?: User;               // Populated for display
  tags: string[];                // Required per spec: tags[]
  createdAt: Date;               // Required per spec
  updatedAt: Date;               // Required per spec
  version?: number;              // For optimistic concurrency control
}

// Spec requires exactly these three status values
export enum IssueStatus {
  OPEN = 'OPEN',                 // Maps to spec: "Open"
  IN_PROGRESS = 'IN_PROGRESS',   // Maps to spec: "InProgress"
  CLOSED = 'CLOSED'              // Maps to spec: "Closed"
}

// Common priority levels (not specified in spec, but standard practice)
export enum IssuePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface IssueComment {
  id: string;
  issueId: string;
  userId: string;
  user?: User;                   // Populated for display
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IssueActivity {
  id: string;
  issueId: string;
  userId: string;
  user?: User;                   // Populated for display
  action: string;                // e.g., "created", "updated", "status_changed"
  field?: string;                // Field that was changed (e.g., "status", "priority")
  oldValue?: string;             // Previous value
  newValue?: string;             // New value
  createdAt: Date;
}

// Type-safe request interfaces
export interface CreateIssueRequest {
  projectId: string;             // Required
  title: string;                 // Required
  description: string;           // Required
  priority: IssuePriority;       // Required
  assigneeId?: string;           // Optional
  tags?: string[];               // Optional, defaults to empty array
}

export interface UpdateIssueRequest {
  title?: string;                // All fields optional for updates
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string;
  tags?: string[];
  version?: number;              // For optimistic concurrency control
}

// Filter interface for query parameters
export interface IssueFilters {
  status?: IssueStatus[];        // Can filter by multiple statuses
  priority?: IssuePriority[];    // Can filter by multiple priorities
  assigneeId?: string;           // Filter by assignee
  tag?: string;                  // Filter by tag
  search?: string;               // Text search on title (per spec)
}

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}
