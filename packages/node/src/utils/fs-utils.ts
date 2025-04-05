import { promises as fs } from 'fs';

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
