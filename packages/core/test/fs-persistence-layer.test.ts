import * as path from 'path';
import FsBootstrapLayer from '../src/layers/fs/fs-bootstrap.layer';
import FsPersistenceLayer from '../src/layers/fs/fs-persistence.layer';
import {ContentService} from '../src/services/content.service';
import {FieldTypeService} from '../src/services/field-type.service';
import DefaultContentLayer from '../src/layers/default/default-content.layer';

const dataDir = path.join(__dirname, 'root');
const bootstrap = new FsBootstrapLayer({ root: dataDir });
const persistence = new FsPersistenceLayer({ root: dataDir });
const fieldTypeService = new FieldTypeService(DefaultContentLayer);
const contentService = new ContentService(fieldTypeService, bootstrap, persistence);

(async () => {
  try {
    // const quartzTier = {
    //   id: 'quartz',
    //   tier: 'Quartz Supporter',
    //   available: true,
    //   category: 'sponsor',
    //   donation: 500,
    //   forWhom: [ 'Small Dev Agencies', 'Indie Devs' ],
    //   description: 'Test.'
    // };
    //
    // await contentService.saveDocument('sponsor-tiers', quartzTier);

    // const business = {
    //   brand: 'hosuaby',
    //   registrationNumber: '914 336 003 00019',
    //   address: '12 place des Dominos, 92400 Courbevoie, France',
    //   vatNumber: 'FR20 914 336 003',
    // };
    //
    // await contentService.saveDocument('business', business);

    const doc = {
      id: 'tier-partner',
      category: '#partner #founding partner',
    };

    await contentService.saveDocument('test', doc);
  } catch (err) {
    console.error(err);
  }
})();
