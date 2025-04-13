import {DeliveryLayer, RenderedDocument} from '@sapphire-cms/core';
import {NodeModuleParams} from './node.module';
import {resolveWorkPaths} from './params-utils';
import { promises as fs } from 'fs';
import * as path from 'path';
import {ensureDirectory} from '../utils';

export default class NodeDeliveryLayer implements DeliveryLayer<NodeModuleParams> {
  private readonly outputDir: string;

  public constructor(readonly params: NodeModuleParams) {
    this.outputDir = resolveWorkPaths(params).outputDir;
  }

  public async deliverContent(renderedDocument: RenderedDocument): Promise<void> {
    const ref = renderedDocument.ref;

    let contentFile: string;

    switch (renderedDocument.mime) {
      case 'application/json':
        contentFile = `${ref.variant}.json`;
        break;
      default:
        throw new Error(`Unsupported MIME type: "${renderedDocument.mime}"`);
    }

    const targetDir = path.join(this.outputDir, ref.store, ...ref.path, ...(ref.docId ? [ref.docId] : []));
    await ensureDirectory(targetDir);
    return fs.writeFile(path.join(targetDir, contentFile), renderedDocument.content);
  }
}
