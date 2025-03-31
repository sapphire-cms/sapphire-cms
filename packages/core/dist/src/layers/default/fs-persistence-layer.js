import { ZContentSchema } from '../../model/content-schema';
import yaml from 'yaml';
import * as path from 'path';
import fs from 'fs';
export default class FsPersistenceLayer {
    dataDir;
    schemasDir;
    constructor(dataDir) {
        this.dataDir = dataDir;
        this.schemasDir = path.join(dataDir, 'schemas');
    }
    getAllSchemas() {
        return new Promise((resolve, reject) => {
            fs.readdir(this.schemasDir, (err, files) => {
                if (err) {
                    reject(err);
                }
                const schemaFiles = files
                    .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
                    .map(file => path.join(this.schemasDir, file));
                const schemas = schemaFiles
                    .map(file => fs.readFileSync(file, 'utf-8'))
                    .map(raw => yaml.parse(raw))
                    .map(yaml => {
                    const result = ZContentSchema.safeParse(yaml);
                    if (!result.success) {
                        reject(result.error.format());
                        return null;
                    }
                    return result.data;
                })
                    .filter(schema => schema);
                resolve(schemas);
            });
        });
    }
}
//# sourceMappingURL=fs-persistence-layer.js.map