import * as path from 'path';
import {
  Artifact,
  DeliveredArtifact,
  DeliveryError,
  DeliveryLayer,
  Option,
} from '@sapphire-cms/core';
import { Outcome, Program, program } from 'defectless';
import { Encoding, fileExists, FsError, readBinaryFile, writeFileSafeDir } from '../common';
import { NodeModuleParams } from './node.module';
import { resolveWorkPaths } from './params-utils';

export default class NodeDeliveryLayer implements DeliveryLayer<NodeModuleParams> {
  private readonly outputDir: string;

  constructor(params: NodeModuleParams) {
    this.outputDir = resolveWorkPaths(params).outputDir;
  }

  public deliverArtefacts(artifacts: Artifact[]): Outcome<DeliveredArtifact[], DeliveryError> {
    const deliveredArtifacts = artifacts.map((artifact) => this.deliverArtefact(artifact));
    return Outcome.all(deliveredArtifacts).mapFailure(
      (deliveryErrors) => new DeliveryError('Failed to deliver some of artifacts', deliveryErrors),
    );
  }

  public getArtifactContent(resourcePath: string): Outcome<Option<Uint8Array>, DeliveryError> {
    return program(function* (): Program<Option<Uint8Array>, FsError> {
      const resourceExists: boolean = yield fileExists(resourcePath);

      if (!resourceExists) {
        return Option.none();
      }

      const content: Uint8Array = yield readBinaryFile(resourcePath);
      return Option.some(content);
    }, this).mapFailure((fsError) => fsError.wrapIn(DeliveryError));
  }

  private deliverArtefact(artifact: Artifact): Outcome<DeliveredArtifact, DeliveryError> {
    let contentFile: string;
    let encoding: Encoding;

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

    return writeFileSafeDir(contentFile, artifact.content, encoding)
      .mapFailure((fsError) => fsError.wrapIn(DeliveryError))
      .map(() =>
        Object.assign(
          {
            provider: 'node',
            resourcePath: contentFile,
          },
          artifact,
        ),
      );
  }
}
