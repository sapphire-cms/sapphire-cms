import { Dirent, promises as fs } from 'fs';
import * as path from 'path';
import { success, Outcome } from 'defectless';
import { FsError } from './errors';

export function fileExists(filePath: string): Outcome<boolean, FsError> {
  return Outcome.fromSupplier(
    () => fs.access(filePath),
    (error) => error,
  )
    .map(() => true)
    .recover(() => success(false));
}

export function readTextFile(filename: string): Outcome<string, FsError> {
  return Outcome.fromSupplier(
    () => fs.readFile(filename, 'utf-8'),
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
export function ensureDirectory(folderPath: string): Outcome<string, FsError> {
  const fullPath = path.resolve(folderPath);
  return Outcome.fromSupplier(
    () => fs.mkdir(fullPath, { recursive: true }),
    (err) => new FsError(`Failed to create directory ${fullPath}`, err),
  ).map(() => fullPath);
}

export function writeFileSafeDir(filename: string, content: string): Outcome<void, FsError> {
  return ensureDirectory(path.dirname(filename)).flatMap(() =>
    Outcome.fromSupplier(
      () => fs.writeFile(filename, content, 'utf-8'),
      (err) => new FsError(`Failed to write into file ${filename}`, err),
    ),
  );
}

export function listDirectoryEntries(dir: string, recursive = false): Outcome<Dirent[], FsError> {
  return Outcome.fromSupplier(
    () => fs.readdir(dir, { recursive, withFileTypes: true }),
    (err) => new FsError(`Failed to read directory ${dir}`, err),
  );
}

export function isDirectoryEmpty(dir: string): Outcome<boolean, FsError> {
  return listDirectoryEntries(dir).map((entries) => entries.length === 0);
}

export function rmFile(filename: string): Outcome<void, FsError> {
  return Outcome.fromSupplier(
    () => fs.rm(filename),
    (err) => new FsError(`Failed to remove file ${filename}`, err),
  );
}

export function rmDirectory(dir: string, recursive = false, force = false): Outcome<void, FsError> {
  return Outcome.fromSupplier(
    () => fs.rm(dir, { recursive, force }),
    (err) => new FsError(`Failed to remove directory ${dir}`, err),
  );
}
