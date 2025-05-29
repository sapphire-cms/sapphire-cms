import * as process from 'node:process';
import * as path from 'path';

export function getInvocationDir(): string {
  const args = process.argv.slice(2);
  return args.length === 1 ? path.resolve(args[0]) : process.cwd();
}
