import { promises as fs } from 'fs';
import * as path from 'path';
import {
  Artifact,
  DeliveredArtifact,
  DeliveryError,
  DeliveryLayer,
  Outcome,
} from '@sapphire-cms/core';
import { ensureDirectory } from '../common';
import { NodeModuleParams } from './node.module';
import { resolveWorkPaths } from './params-utils';

export default class NodeDeliveryLayer implements DeliveryLayer<NodeModuleParams> {
  private readonly outputDir: string;

  constructor(params: NodeModuleParams) {
    this.outputDir = resolveWorkPaths(params).outputDir;
  }

  public deliverArtefact(artifact: Artifact): Outcome<DeliveredArtifact, DeliveryError> {
    let contentFile: string;
    let encoding: 'ascii' | 'utf-8' | 'latin1' | 'binary';

    switch (artifact.mime) {
      case 'text/plain':
        contentFile = `${artifact.slug}.txt`;
        encoding = 'utf-8';
        break;
      case 'text/html':
        contentFile = `${artifact.slug}.html`;
        encoding = 'utf-8';
        break;
      case 'text/javascript':
        contentFile = `${artifact.slug}.js`;
        encoding = 'utf-8';
        break;
      case 'application/json':
        contentFile = `${artifact.slug}.json`;
        encoding = 'utf-8';
        break;
      case 'application/yaml':
        contentFile = `${artifact.slug}.yaml`;
        encoding = 'utf-8';
        break;
      case 'application/typescript':
        contentFile = `${artifact.slug}.ts`;
        encoding = 'utf-8';
        break;
      default:
        contentFile = `${artifact.slug}.bin`;
        encoding = 'binary';
    }

    contentFile = path.join(this.outputDir, contentFile);
    const targetDir = path.dirname(contentFile);

    return ensureDirectory(targetDir)
      .mapFailure((fsError) => fsError.wrapIn(DeliveryError))
      .flatMap(() =>
        Outcome.fromSupplier(
          () => fs.writeFile(contentFile, artifact.content, encoding),
          (err) => new DeliveryError(`Failed to write into file ${contentFile}`, err),
        ),
      )
      .map(() =>
        Object.assign(
          {
            resourcePath: contentFile,
          },
          artifact,
        ),
      );
  }
}
