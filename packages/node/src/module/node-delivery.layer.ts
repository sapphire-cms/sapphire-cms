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
    let encoding: 'ascii' | 'utf-8' | 'latin1' | 'binary';

    switch (renderedDocument.mime) {
      case 'text/plain':
        contentFile = `${ref.variant}.txt`;
        encoding = 'utf-8';
        break;
      case 'text/html':
        contentFile = `${ref.variant}.html`;
        encoding = 'utf-8';
        break;
      case 'text/javascript':
        contentFile = `${ref.variant}.js`;
        encoding = 'utf-8';
        break;
      case 'application/json':
        contentFile = `${ref.variant}.json`;
        encoding = 'utf-8';
        break;
      case 'application/yaml':
        contentFile = `${ref.variant}.yaml`;
        encoding = 'utf-8';
        break;
      case 'application/typescript':
        contentFile = `${ref.variant}.ts`;
        encoding = 'utf-8';
        break;
      default:
        contentFile = `${ref.variant}.bin`;
        encoding = 'binary';
    }

    const targetDir = path.join(this.outputDir, ref.store, ...ref.path, ...(ref.docId ? [ref.docId] : []));
    await ensureDirectory(targetDir);
    return fs.writeFile(path.join(targetDir, contentFile), renderedDocument.content, encoding);
  }
}
