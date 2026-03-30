export type Frontmatter = Record<string, string>;

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  due_date?: string;
  completed_at?: string;
  application_id?: string;
}

export interface Application {
  id: string;
  company_name: string;
  position: string;
  status: string;
  applied_at: string;
  agent_name?: string;
  agent_email?: string;
  notes?: string;
  updated_at: string;
  tasks: Task[];
}
