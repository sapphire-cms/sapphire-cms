import * as yaml from 'yaml';
import camelcaseKeys from 'camelcase-keys';
import * as path from 'path';
import {promises as fs} from 'fs';
import {FsModuleParams} from './fs.module';
import {BootstrapLayer} from '@sapphire-cms/core/dist/layers/bootstrap.layer';
import {ContentSchema, ZContentSchema} from '@sapphire-cms/core/dist/model/content-schema';

export default class FsBootstrapLayer implements BootstrapLayer<FsModuleParams> {
  private readonly schemasDir: string;

  constructor(readonly params: FsModuleParams) {
    this.schemasDir = path.join(params.root, 'schemas');
  }

  public async getAllSchemas(): Promise<ContentSchema[]> {
    const files = await fs.readdir(this.schemasDir);

    const schemaFiles = files
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map(file => path.join(this.schemasDir, file));

    const schemaPromises = schemaFiles.map(async (file) => {
      const raw = await fs.readFile(file, 'utf-8');
      const parsed = camelcaseKeys(yaml.parse(raw), { deep: true });

      const result = ZContentSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(`Invalid schema in ${file}:\n${JSON.stringify(result.error.format(), null, 2)}`);
      }

      return result.data;
    });

    return Promise.all(schemaPromises);
  }
}
