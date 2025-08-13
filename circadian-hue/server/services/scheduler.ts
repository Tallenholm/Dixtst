export interface Job {
  id: string;
  clear: () => void;
}

// Map of job IDs to their scheduled handles
export interface JobMap extends Map<string, Job> {}

export class Scheduler {
  private jobs: JobMap = new Map();

  /** Schedule a job to run repeatedly. */
  scheduleInterval(id: string, fn: () => void, ms: number): void {
    this.clear(id);
    const handle = setInterval(fn, ms);
    this.jobs.set(id, { id, clear: () => clearInterval(handle) });
  }

  /** Schedule a job to run once after a delay. */
  scheduleTimeout(id: string, fn: () => void, ms: number): void {
    this.clear(id);
    const handle = setTimeout(() => {
      fn();
      this.jobs.delete(id);
    }, ms);
    this.jobs.set(id, { id, clear: () => clearTimeout(handle) });
  }

  /** Cancel a scheduled job. */
  clear(id: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.clear();
      this.jobs.delete(id);
    }
  }
}
