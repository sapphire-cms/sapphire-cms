import * as path from 'path';
import FsHostingLayer from '../src/layers/default/fs-hosting-layer';
import FsPersistenceLayer from '../src/layers/default/fs-persistence-layer';
import {generateId} from '../src/services/id-generator';

const dataDir = path.join(__dirname, 'root');
const hosting = new FsHostingLayer(dataDir);
const persistence = new FsPersistenceLayer(dataDir);

(async () => {
  try {
    const schemas = await hosting.getAllSchemas();
    // console.dir(schemas, { depth: null });

    for (const schema of schemas) {
      await persistence.prepareStore(schema);
    }

    // const idFieldName = schemas[0].fields
    //     .filter(field => field.type === 'id')[0].name;

    const doc = {
      id: 'quartz',
      tier: 'Quartz Supporter',
      available: true,
      category: 'sponsor',
      donation: 500,
      forWhom: [ 'Small Dev Agencies', 'Indie Devs' ],
      description: 'Test.'
    };

    // const documentId = doc[idFieldName] as unknown as string;

    await persistence.putToCollection('sponsor-tiers', generateId('sponsor-tiers'), doc);
  } catch (err) {
    console.error(err);
  }
})();
