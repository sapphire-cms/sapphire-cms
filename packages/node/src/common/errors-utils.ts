import { Throwable } from '@sapphire-cms/core';
import chalk from 'chalk';

export function printError(error: Throwable | unknown): void {
  if (!(error instanceof Throwable)) {
    console.error(error);
    return;
  }

  console.error(chalk.gray('Error occurred in process\n'));
  console.error(chalk.red(chalk.bold(error._tag)) + ': ' + chalk.blueBright(error.message));

  const cause = error.cause;

  if (cause) {
    console.error(chalk.yellow('Caused by'));
    printError(cause);
  }
}
