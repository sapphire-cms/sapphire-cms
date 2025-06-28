import { Command } from '@commander-js/extra-typings';

export type CliCommand = (program: Command, invocationDir: string) => void;
