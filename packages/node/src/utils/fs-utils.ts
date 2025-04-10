import { promises as fs } from 'fs';
import * as path from 'path';

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function findYamlFile(filename: string): Promise<string | null> {
  const yaml = filename + '.yaml';
  const yml = filename + '.yml';

  if (await fileExists(yaml)) {
    return yaml;
  } else if (await fileExists(yml)) {
    return yml;
  } else {
    return null;
  }
}

function getPathWithoutExtension(filename: string): string {
  const parsed = path.parse(path.resolve(filename));
  return path.format({ ...parsed, base: undefined, ext: '' });
}

export async function resolveYamlFile(filename: string): Promise<string | null> {
  const withoutExt = getPathWithoutExtension(filename);
  return findYamlFile(withoutExt);
}

/**
 * Ensures that the given directory exists.
 * If it doesn't, the directory will be created (including parent folders).
 * @param folderPath - Path to the directory (absolute or relative)
 * @returns The resolved absolute folder path
 */
export async function ensureDirectory(folderPath: string): Promise<string> {
  const fullPath = path.resolve(folderPath);
  await fs.mkdir(fullPath, { recursive: true });
  return fullPath;
}

export async function writeFileSafeDir(filename: string, content: string): Promise<void> {
  await ensureDirectory(path.dirname(filename));
  return fs.writeFile(filename, content, 'utf-8');
}
