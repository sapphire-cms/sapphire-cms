import {defineModule, getBuildParamsType} from '@sapphire-cms/core/dist/modules/module';
import FsBootstrapLayer from './fs-bootstrap.layer';
import FsPersistenceLayer from './fs-persistence.layer';

const moduleParamsDef = [
  {
    name: 'root',
    description: 'Absolute or relative path to the folder where CMS will store its data.',
    type: 'string',
    required: true,
  }
] as const;

const params = getBuildParamsType(moduleParamsDef);
export type FsModuleParams = typeof params;

const fsModule = defineModule(
    'fs',
    moduleParamsDef,
    {
      bootstrap: FsBootstrapLayer,
      persistence: FsPersistenceLayer,
    }
);
export default fsModule;
