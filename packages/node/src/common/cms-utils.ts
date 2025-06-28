import { Dirent } from 'fs';
import * as path from 'path';
import { Option, SapphireModuleClass } from '@sapphire-cms/core';
import { Outcome, Program, program } from 'defectless';
import { FsError, ModuleLoadingError } from './errors';
import { listDirectoryEntries } from './fs-utils';
import { findYamlFile } from './yaml-utils';

export function findSapphireModulesManifestFiles(
  nodeModulesPath: string,
): Outcome<string[], FsError> {
  return program(function* (): Program<string[], FsError> {
    const discoveredManifests: string[] = [];

    const entries: Dirent[] = yield listDirectoryEntries(nodeModulesPath);

    for (const entry of entries) {
      const fullEntryPath = path.join(nodeModulesPath, entry.name);

      // Find manifests of official modules
      if (entry.name === '@sapphire-cms') {
        const scopedPackages: Dirent[] = yield listDirectoryEntries(fullEntryPath);
        const findManifestsTasks = scopedPackages
          .map((sub) => path.join(fullEntryPath, sub.name, 'sapphire-cms.manifest'))
          .map((manifestFilename) => findYamlFile(manifestFilename));
        const foundManifests: Option<string>[] = yield Outcome.all(findManifestsTasks).mapFailure(
          (errors) => {
            // TODO: find a cleaner solution. Do not swallow the errors
            return errors.filter((error) => !!error)[0];
          },
        );
        foundManifests
          .filter((option) => Option.isSome(option))
          .map((option) => option.value)
          .forEach((manifestFile) => discoveredManifests.push(manifestFile));
      }

      // Find manifests of community modules
      if (entry.name.startsWith('sapphire-cms-')) {
        const manifestPath: Option<string> = yield findYamlFile(
          path.join(fullEntryPath, 'sapphire-cms.manifest'),
        );

        if (Option.isSome(manifestPath)) {
          discoveredManifests.push(manifestPath.value);
        }
      }
    }

    return discoveredManifests;
  });
}

export function loadModuleFromFile(
  moduleFile: string,
): Outcome<SapphireModuleClass, ModuleLoadingError> {
  return Outcome.fromSupplier(
    () => import(moduleFile),
    (err) => new ModuleLoadingError(`Failed to load module from the file ${moduleFile}`, err),
  ).map((module) => module.default as SapphireModuleClass);
}
