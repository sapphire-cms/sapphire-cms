import { confirm } from '@inquirer/prompts';
import {
  AbstractAdminLayer,
  AuthorizationError,
  Credential,
  DocsCopyMetadata,
  Framework,
  OuterError,
  PortError,
  PublicInfo,
  TaskState,
  TaskStatus,
} from '@sapphire-cms/core';
import chalk from 'chalk';
import { Outcome, Program, program, success } from 'defectless';
import { Cmd } from '../common';
import { CliModuleParams } from './cli.module';
import { TaskProgressService } from './services/task-progress.service';

function delay(ms: number): Outcome<void, never> {
  return Outcome.fromSupplier(() => new Promise((resolve) => setTimeout(resolve, ms)));
}

export class CliAdminLayer extends AbstractAdminLayer<CliModuleParams> {
  private static interruptRequested = false;
  private static taskCanceled = false;
  private static interruptionHandler: () => Promise<void> | undefined;
  public readonly framework = Framework.NONE;

  constructor(
    private readonly params: {
      cmd: string;
      args: string[];
      opts: string[];
      credential: string | undefined;
    },
  ) {
    super();
  }

  public afterPortsBound(): Outcome<void, never> {
    if (
      !this.params.cmd.startsWith('info:') &&
      !this.params.cmd.startsWith('package:') &&
      !this.params.cmd.startsWith('cms:')
    ) {
      return success();
    }

    const credential = this.params.credential
      ? {
          credential: this.params.credential,
        }
      : undefined;

    switch (this.params.cmd) {
      case Cmd.info_show:
        return Outcome.fromSupplier(() =>
          this.publicInfoPort().match(
            (info: PublicInfo) => console.log(JSON.stringify(info, null, 2)),
            (err) => console.error(err),
            (defect) => console.error(defect),
          ),
        );
      case Cmd.package_install:
        return Outcome.fromSupplier(() =>
          this.installPackagesPort(this.params.args, credential).match(
            () => {},
            (err) => console.error(err),
            (defect) => console.error(defect),
          ),
        );
      case Cmd.package_remove:
        return Outcome.fromSupplier(() =>
          this.removePackagesPort(this.params.args, credential).match(
            () => {},
            (err) => console.error(err),
            (defect) => console.error(defect),
          ),
        );
      case Cmd.cms_backup:
        return Outcome.fromSupplier(() =>
          this.backup(credential).match(
            () => {},
            (err) => console.error(err),
            (defect) => console.error(defect),
          ),
        );
      case Cmd.cms_restore:
        return Outcome.fromSupplier(() =>
          this.restore(credential).match(
            () => {},
            (err) => console.error(err),
            (defect) => console.error(defect),
          ),
        );
      default:
        console.error(`Unknown command: "${this.params.cmd}"`);
        return success();
    }
  }

  private backup(
    credential?: Credential,
  ): Outcome<void, OuterError | AuthorizationError | PortError> {
    return program(function* (): Program<void, OuterError | AuthorizationError | PortError> {
      const continueBackup: boolean = yield CliAdminLayer.confirm(
        'This operation will copy all documents from the primary persistence engine to the backup engine. The process may take some time. Do you want to continue?',
      );

      if (!continueBackup) {
        return success();
      }

      const taskState: TaskState<DocsCopyMetadata> = yield this.startBackupTaskPort(credential);
      const progressService = new TaskProgressService('Backup');

      return this.followTask(taskState.id, progressService, credential);
    }, this);
  }

  private restore(
    credential?: Credential,
  ): Outcome<void, OuterError | AuthorizationError | PortError> {
    return program(function* (): Program<void, OuterError | AuthorizationError | PortError> {
      const continueBackup: boolean = yield CliAdminLayer.confirm(
        'This operation will restore all documents from the backup persistence engine to the primary engine. The process may take some time. Do you want to continue?',
      );

      if (!continueBackup) {
        return success();
      }

      const taskState: TaskState<DocsCopyMetadata> = yield this.startRestoreTaskPort(credential);
      const progressService = new TaskProgressService('Restore');

      return this.followTask(taskState.id, progressService, credential);
    }, this);
  }

  private followTask(
    taskId: string,
    progressService: TaskProgressService,
    credential?: Credential,
  ): Outcome<void, OuterError | AuthorizationError | PortError> {
    CliAdminLayer.interruptionHandler = CliAdminLayer.createInterruptionHandler(progressService);
    CliAdminLayer.setupKillInterceptor();
    progressService.start();

    return program(function* (): Program<void, OuterError | AuthorizationError | PortError> {
      let taskState: TaskState<DocsCopyMetadata>;

      do {
        taskState = yield CliAdminLayer.taskCanceled
          ? this.abortTaskPort(taskId, credential)
          : this.taskStatusPort(taskId, credential);

        if (taskState.metadata) {
          progressService.progress(taskState);
        }

        yield delay(500);
      } while (!CliAdminLayer.isTaskFinished(taskState));

      progressService.stop();
    }, this);
  }

  private static confirm(message: string, onAbort: boolean = false): Outcome<boolean, never> {
    return Outcome.fromSupplier(
      () =>
        confirm({
          message,
        }),
      (err) => err,
    ).recover(() => onAbort);
  }

  private static isTaskFinished(taskState: TaskState<DocsCopyMetadata>): boolean {
    return (
      taskState.status === TaskStatus.completed ||
      taskState.status === TaskStatus.failed ||
      taskState.status === TaskStatus.aborted
    );
  }

  private static createInterruptionHandler(
    progressService: TaskProgressService,
  ): () => Promise<void> {
    return () => {
      progressService.stop();

      if (CliAdminLayer.interruptRequested) {
        CliAdminLayer.taskCanceled = true;
        return Promise.resolve();
      }

      CliAdminLayer.interruptRequested = true;

      CliAdminLayer.removeKillInterceptor();
      return CliAdminLayer.confirm(
        'A task is currently running. Do you really want to abort it?',
        true,
      )
        .tap((interrupt) => {
          CliAdminLayer.interruptRequested = false;
          CliAdminLayer.taskCanceled = interrupt;

          if (interrupt) {
            console.log(chalk.red('Aborting task...'));
          } else {
            progressService.start();
          }
        })
        .finally(() => {
          CliAdminLayer.setupKillInterceptor();
          return success();
        })
        .match(
          () => {},
          (error) => {
            console.error(error);
          },
          (defect) => {
            console.error(defect);
          },
        );
    };
  }

  private static setupKillInterceptor() {
    if (CliAdminLayer.interruptionHandler) {
      process.on('SIGINT', CliAdminLayer.interruptionHandler);
      process.on('SIGTERM', CliAdminLayer.interruptionHandler);
    }
  }

  private static removeKillInterceptor() {
    if (CliAdminLayer.interruptionHandler) {
      process.off('SIGINT', CliAdminLayer.interruptionHandler);
      process.off('SIGTERM', CliAdminLayer.interruptionHandler);
    }
  }
}
