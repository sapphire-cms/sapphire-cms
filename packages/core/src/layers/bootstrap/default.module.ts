import {defineModule} from './module';
import {ContentLayer, DefaultContentLayer} from '../content';
import {BuildParams} from '../../common';

const DefaultModule = defineModule(
    'default',
    [] as const,
    {
      content: DefaultContentLayer as unknown as new (params: BuildParams<readonly []>) => ContentLayer<BuildParams<readonly []>>,
    },
);
export default DefaultModule;
