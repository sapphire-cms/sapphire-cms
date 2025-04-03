import {promises as fs} from 'fs';
import {z, ZodTypeAny} from 'zod';
import camelcaseKeys from 'camelcase-keys';
import * as yaml from 'yaml';

export async function loadYaml<T extends ZodTypeAny>(file: string, schema: T): Promise<z.infer<T>> {
  const raw = await fs.readFile(file, 'utf-8');
  const parsed = camelcaseKeys(yaml.parse(raw), { deep: true });

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid schema in ${file}:\n${JSON.stringify(result.error.format(), null, 2)}`);
  }

  return result.data;
}
