import { DocsCopyMetadata, TaskState } from '@sapphire-cms/core';
import chalk from 'chalk';
import * as cliProgress from 'cli-progress';
import ora, { Ora } from 'ora';

export class TaskProgressService {
  private readonly spinner: Ora;
  private readonly bar: cliProgress.SingleBar;
  private taskState: TaskState<DocsCopyMetadata> | undefined = undefined;

  constructor(private readonly taskName: string) {
    this.spinner = ora({
      text: `Starting ${taskName}`,
    });

    this.bar = new cliProgress.SingleBar({
      format:
        `${taskName} Progress |` +
        chalk.blueBright('{bar}') +
        '| {percentage}% || {value}/{total} Documents | ETA: {eta_formatted}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    });
  }

  public start(): void {
    if (!this.taskState) {
      this.spinner.start(`Starting ${this.taskName}`);
    } else {
      this.bar.start(
        this.taskState.metadata!.totalDocsCount,
        this.taskState.metadata!.copiedDocsCount,
      );
    }
  }

  public progress(taskState: TaskState<DocsCopyMetadata>): void {
    if (!this.taskState) {
      this.spinner.stop();
      this.bar.start(taskState.metadata!.totalDocsCount, 0);
    } else {
      this.bar.update(taskState.metadata!.copiedDocsCount);
    }

    this.taskState = taskState;
  }

  public stop(): void {
    this.spinner.stop();
    this.bar.stop();
  }
}
