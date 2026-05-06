import { Outcome } from 'defectless';
import { AnyParams, Throwable } from '../../common';
import { Env, Framework, Layer, PlatformError, TaskFn, TaskState, WebModule } from '../../kernel';
import { HttpLayer } from '../../kernel/http-layer';

export interface PlatformLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config> {
  acceptedAdapters: string[];
  supportedFrameworks: Framework[];

  getEnv(): Outcome<Env, PlatformError>;

  addRestController(controller: HttpLayer): void;
  addWebModule(webModule: WebModule): void;

  listTasks(): Outcome<TaskState[], PlatformError>;
  startTask<E extends Throwable>(task: TaskFn<E>): Outcome<TaskState, PlatformError>;
  taskStatus(taskId: string): Outcome<TaskState, PlatformError>;
  abortTask(taskId: string): Outcome<TaskState, PlatformError>;

  start(): Outcome<void, PlatformError>;
  halt(): Outcome<void, PlatformError>;
}
