export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: Date;
  userId?: string;              // Optional: user who triggered the event
}

// All possible WebSocket message types per spec requirements
export enum WebSocketMessageType {
  // Issue events (per spec: "Push updates when an issue changes")
  ISSUE_CREATED = 'ISSUE_CREATED',
  ISSUE_UPDATED = 'ISSUE_UPDATED',
  ISSUE_DELETED = 'ISSUE_DELETED',
  ISSUE_STATUS_CHANGED = 'ISSUE_STATUS_CHANGED',
  ISSUE_PRIORITY_CHANGED = 'ISSUE_PRIORITY_CHANGED',
  ISSUE_ASSIGNED = 'ISSUE_ASSIGNED',
  
  // Comment events (per spec: "comment thread")
  COMMENT_ADDED = 'COMMENT_ADDED',
  COMMENT_UPDATED = 'COMMENT_UPDATED',
  COMMENT_DELETED = 'COMMENT_DELETED',
  
  // Project events
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  PROJECT_MEMBER_ADDED = 'PROJECT_MEMBER_ADDED',
  PROJECT_MEMBER_REMOVED = 'PROJECT_MEMBER_REMOVED',
  
  // Connection events
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  PING = 'PING',
  PONG = 'PONG'
}

// Specific payload types for type safety
export interface IssueWebSocketPayload {
  id: string;
  projectId: string;
  title?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  version?: number;
}

export interface CommentWebSocketPayload {
  id: string;
  issueId: string;
  projectId: string;
  userId: string;
  content?: string;
}

export interface ProjectWebSocketPayload {
  id: string;
  name?: string;
  ownerId?: string;
}

export interface ConnectionPayload {
  userId: string;
  sessionId: string;
  timestamp: Date;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: any;
}
