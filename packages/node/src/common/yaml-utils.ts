import { Option } from '@sapphire-cms/core';
import camelcaseKeys from 'camelcase-keys';
import { Program, program, failure, Outcome } from 'defectless';
import * as yaml from 'yaml';
import { z, ZodTypeAny } from 'zod';
import { FsError, YamlParsingError } from './errors';
import { fileExists, getPathWithoutExtension, readTextFile } from './fs-utils';

export function findYamlFile(filename: string): Outcome<Option<string>, FsError> {
  const yaml = filename + '.yaml';
  const yml = filename + '.yml';

  return program(function* (): Program<Option<string>, FsError> {
    if (yield fileExists(yaml)) {
      return Option.some(yaml);
    } else if (yield fileExists(yml)) {
      return Option.some(yml);
    } else {
      return Option.none();
    }
  });
}

export function resolveYamlFile(filename: string): Outcome<Option<string>, FsError> {
  const withoutExt = getPathWithoutExtension(filename);
  return findYamlFile(withoutExt);
}

export function loadYaml<T extends ZodTypeAny>(
  file: string,
  schema: T,
): Outcome<z.infer<T>, FsError | YamlParsingError> {
  return program(function* (): Program<z.infer<T>, FsError | YamlParsingError> {
    const raw = yield readTextFile(file);

    let result;

    try {
      const parsed = camelcaseKeys(yaml.parse(raw), { deep: true });
      result = schema.safeParse(parsed);
    } catch (parsingError) {
      return failure(new YamlParsingError(`Failed to parse YAML file ${file}`, parsingError));
    }

    if (!result.success) {
      return failure(
        new YamlParsingError(
          `Invalid file structure in ${file}:\n${JSON.stringify(result.error.format(), null, 2)}`,
        ),
      );
    }

    return result.data;
  });
}
