import {HostingLayer} from '../hosting-layer';
import {ContentSchema, ZContentSchema} from '../../model/content-schema';
import yaml from 'yaml';
import * as path from 'path';
import { promises as fs } from 'fs';

export default class FsHostingLayer implements HostingLayer {
  private readonly schemasDir: string;

  constructor(readonly root: string) {
    this.schemasDir = path.join(root, 'schemas');
  }

  public async getAllSchemas(): Promise<ContentSchema[]> {
    const files = await fs.readdir(this.schemasDir);

    const schemaFiles = files
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map(file => path.join(this.schemasDir, file));

    const schemaPromises = schemaFiles.map(async (file) => {
      const raw = await fs.readFile(file, 'utf-8');
      const parsed = yaml.parse(raw);

      const result = ZContentSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(`Invalid schema in ${file}:\n${JSON.stringify(result.error.format(), null, 2)}`);
      }

      return result.data;
    });

    return Promise.all(schemaPromises);
  }
}
