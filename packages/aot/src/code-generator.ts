import * as path from 'path';
import { fileURLToPath } from 'url';
import { CmsConfig } from '@sapphire-cms/core';
import { FsError, writeFileSafeDir } from '@sapphire-cms/node';
import { Outcome } from 'defectless';
import { Eta } from 'eta';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CodeGenerator {
  public csmConfig!: CmsConfig;
  public modules!: Record<string, string>;
  public contentSchemas!: Record<string, object>;
  public pipelineSchemas!: Record<string, object>;

  private readonly eta = new Eta({ views: __dirname });

  constructor(private readonly outputFile: string) {}

  public generate(): Outcome<void, FsError> {
    const generatedCode = this.eta.render('./aot-file', {
      cmsConfig: this.csmConfig,
      modules: this.modules,
      contentSchemas: this.contentSchemas,
      pipelineSchemas: this.pipelineSchemas,
    });

    const aotFile = path.resolve(this.outputFile);

    return writeFileSafeDir(aotFile, generatedCode);
  }
}
