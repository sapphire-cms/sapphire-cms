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

  listTasks(): Outcome<TaskState<unknown>[], PlatformError>;
  startTask<M, E extends Throwable>(task: TaskFn<M, E>): Outcome<TaskState<M>, PlatformError>;
  taskStatus<M>(taskId: string): Outcome<TaskState<M>, PlatformError>;
  abortTask<M>(taskId: string): Outcome<TaskState<M>, PlatformError>;

  start(): Outcome<void, PlatformError>;
  halt(): Outcome<void, PlatformError>;
}
