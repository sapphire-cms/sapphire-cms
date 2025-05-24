import { CliOptions } from './common.types';

export function optsToArray(opts: CliOptions): string[] {
  return Object.entries(opts).map(([key, value]) => `${key}=${value}`);
}

export function optsFromArray(arr: string[]): Map<string, string> {
  const opts = new Map<string, string>();

  for (const opt of arr) {
    const [key, value] = opt.split('=');
    opts.set(key, value);
  }

  return opts;
}
