import type { ExecutionJob } from './types';

export interface BullMQAdapterConfig {
  queueName: string;
  connection?: { host: string; port: number };
  useInMemory?: boolean;
  maxConcurrency?: number;
}

export class BullMQAdapter {
  private queueName: string;
  private jobs = new Map<string, ExecutionJob>();

  constructor(private config: BullMQAdapterConfig) {
    this.queueName = config.queueName;
  }

  async enqueue(job: ExecutionJob): Promise<string> {
    this.jobs.set(job.id, { ...job, status: 'QUEUED' });
    return job.id;
  }

  async getJobStatus(jobId: string): Promise<string | null> {
    const job = this.jobs.get(jobId);
    return job ? job.status : null;
  }

  async updateJobStatus(jobId: string, status: ExecutionJob['status']): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      this.jobs.set(jobId, job);
    }
  }

  async getJob(jobId: string): Promise<ExecutionJob | null> {
    return this.jobs.get(jobId) || null;
  }

  getAllJobs(): ExecutionJob[] {
    return Array.from(this.jobs.values());
  }
}
