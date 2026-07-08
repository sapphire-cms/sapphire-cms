import { fileURLToPath } from 'node:url';
import * as path from 'path';
import {
  AssetUrl,
  MediaAsset,
  MediaError,
  MediaLayer,
  UploadedMediaAsset,
} from '@sapphire-cms/core';
import { Outcome, Program, program } from 'defectless';
import mime from 'mime-types';
import * as packageJson from '../../package.json';
import {
  ensureDirectory,
  FsError,
  isDirectoryEmpty,
  readMedia,
  rmDirectory,
  rmFile,
  writeFileSafeDir,
} from '../common';
import { NodeModuleParams } from './node.module';
import { resolveWorkPaths, WorkPaths } from './params-utils';

export default class NodeMediaLayer implements MediaLayer<NodeModuleParams> {
  private readonly workPaths: WorkPaths;

  constructor(params: NodeModuleParams) {
    this.workPaths = resolveWorkPaths(params);
  }

  public prepareMediaRepo(): Outcome<void, MediaError> {
    return ensureDirectory(this.workPaths.mediaDir)
      .map(() => {})
      .mapFailure((fsError) => new MediaError('Failed to create media repo', fsError));
  }

  public uploadAsset(mediaAsset: MediaAsset): Outcome<UploadedMediaAsset, MediaError> {
    const ext = mime.extension(mediaAsset.mimeType);
    const filename = path.join(this.workPaths.mediaDir, mediaAsset.slug + '.' + ext);

    return writeFileSafeDir(filename, mediaAsset.content, 'binary')
      .map(() => {
        return Object.assign(mediaAsset, {
          provider: `node@${packageJson.version}`,
          providerRef: `file://${filename}`,
        });
      })
      .mapFailure(
        (fsError) => new MediaError(`Failed to persist media file ${mediaAsset.slug}`, fsError),
      );
  }

  public getAsset(providerRef: string): Outcome<UploadedMediaAsset | AssetUrl, MediaError> {
    const filename = fileURLToPath(providerRef);

    return readMedia(filename)
      .map((asset) => {
        return Object.assign(asset, {
          provider: `node@${packageJson.version}`,
          providerRef,
        });
      })
      .mapFailure((err) => new MediaError(`Failed to load media ${providerRef}`, err));
  }

  public thumbnail(providerRef: string): Outcome<UploadedMediaAsset | AssetUrl, MediaError> {
    const filename = fileURLToPath(providerRef);

    return readMedia(filename)
      .map((asset) => {
        return Object.assign(asset, {
          provider: `node@${packageJson.version}`,
          providerRef,
        });
      })
      .mapFailure((err) => new MediaError(`Failed to load media ${providerRef}`, err));
  }

  public deleteAsset(providerRef: string): Outcome<void, MediaError> {
    const filename = fileURLToPath(providerRef);
    const documentDir = path.dirname(filename);

    return program(function* (): Program<void, FsError> {
      yield rmFile(filename);

      if (yield isDirectoryEmpty(documentDir)) {
        yield rmDirectory(documentDir);
      }
    }).mapFailure(
      (fsError) => new MediaError(`Failed to delete media file ${providerRef}`, fsError),
    );
  }
}
