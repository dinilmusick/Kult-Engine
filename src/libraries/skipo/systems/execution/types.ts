export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface ExecutionJob<T = Record<string, unknown>> {
  id: string;
  command: {
    id: string;
    type: string;
    payload?: T;
  };
  priority: JobPriority;
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
  createdAt: number;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}
