import { Dirent, promises as fs } from 'fs';
import * as path from 'path';
import { okAsync, ResultAsync } from 'neverthrow';
import { FsError } from './errors';

export function fileExists(filePath: string): ResultAsync<boolean, FsError> {
  return ResultAsync.fromPromise(fs.access(filePath), (error) => error)
    .map(() => true)
    .orElse(() => okAsync(false));
}

export function readTextFile(filename: string): ResultAsync<string, FsError> {
  return ResultAsync.fromPromise(
    fs.readFile(filename, 'utf-8'),
    (err) => new FsError(`Failed to read file ${filename}`, err),
  );
}

export function getPathWithoutExtension(filename: string): string {
  const parsed = path.parse(path.resolve(filename));
  return path.format({ ...parsed, base: undefined, ext: '' });
}

/**
 * Ensures that the given directory exists.
 * If it doesn't, the directory will be created (including parent folders).
 * @param folderPath - Path to the directory (absolute or relative)
 * @returns The resolved absolute folder path
 */
export function ensureDirectory(folderPath: string): ResultAsync<string, FsError> {
  const fullPath = path.resolve(folderPath);
  return ResultAsync.fromPromise(
    fs.mkdir(fullPath, { recursive: true }),
    (err) => new FsError(`Failed to create directory ${fullPath}`, err),
  ).map(() => fullPath);
}

export function writeFileSafeDir(filename: string, content: string): ResultAsync<void, FsError> {
  return ensureDirectory(path.dirname(filename)).andThen(() =>
    ResultAsync.fromPromise(
      fs.writeFile(filename, content, 'utf-8'),
      (err) => new FsError(`Failed to write into file ${filename}`, err),
    ),
  );
}

export function listDirectoryEntries(
  dir: string,
  recursive = false,
): ResultAsync<Dirent[], FsError> {
  return ResultAsync.fromPromise(
    fs.readdir(dir, { recursive, withFileTypes: true }),
    (err) => new FsError(`Failed to read directory ${dir}`, err),
  );
}

export function isDirectoryEmpty(dir: string): ResultAsync<boolean, FsError> {
  return listDirectoryEntries(dir).map((entries) => entries.length === 0);
}

export function rmFile(filename: string): ResultAsync<void, FsError> {
  return ResultAsync.fromPromise(
    fs.rm(filename),
    (err) => new FsError(`Failed to remove file ${filename}`, err),
  );
}

export function rmDirectory(
  dir: string,
  recursive = false,
  force = false,
): ResultAsync<void, FsError> {
  return ResultAsync.fromPromise(
    fs.rm(dir, { recursive, force }),
    (err) => new FsError(`Failed to remove directory ${dir}`, err),
  );
}
