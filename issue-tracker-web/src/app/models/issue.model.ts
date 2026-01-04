export type IssueStatus = 'Open' | 'InProgress' | 'Closed';

export interface Issue {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: number;
  assigneeId?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
