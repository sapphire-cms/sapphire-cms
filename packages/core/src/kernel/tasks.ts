import { Outcome } from 'defectless';
import { Throwable } from '../common';

export enum TaskStatus {
  pending = 'pending',
  running = 'running',
  completed = 'completed',
  failed = 'failed',
  aborted = 'aborted',
}

export interface TaskState<M> {
  id: string;
  status: TaskStatus;
  startedAt: string;
  finishedAt?: string;
  progress: number; // between 0.0 and 1.0
  failure?: Throwable;
  metadata?: M;
}

export type TaskFn<M, E> = (taskState: TaskState<M>) => Outcome<void, E>;
