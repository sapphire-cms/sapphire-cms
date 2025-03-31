import * as path from 'path';
import FsHostingLayer from '../src/layers/default/fs-hosting-layer';

const dataDir = path.join(__dirname, 'root');
const persistence = new FsHostingLayer(dataDir);

(async () => {
  try {
    const schemas = await persistence.getAllSchemas();
    console.dir(schemas, { depth: null });
  } catch (err) {
    console.error(err);
  }
})();
