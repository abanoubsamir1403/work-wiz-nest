export type UserRole = 'admin' | 'employee' | 'intern';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  status: TaskStatus;
  progress: number;
  due_date: string;
  created_by: string;
  created_at: string;
  assigned_user?: Profile;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user?: Profile;
}

export interface Attachment {
  id: string;
  task_id: string;
  file_url: string;
  file_name: string;
  uploaded_by: string;
  created_at: string;
}
