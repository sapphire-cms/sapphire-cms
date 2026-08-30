import * as path from 'path';
import {
  Artifact,
  DeliveredArtifact,
  DeliveryError,
  DeliveryLayer,
  Option,
} from '@sapphire-cms/core';
import { Outcome, Program, program } from 'defectless';
import { fileExists, FsError, readBinaryFile, writeFileSafeDir } from '../common';
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
    const contentFile = path.join(this.outputDir, `${artifact.slug}.${artifact.extension}`);

    return writeFileSafeDir(contentFile, artifact.content, artifact.encoding)
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
