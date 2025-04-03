import {BuildParams, ParamDef} from '../../common';
import {ContentLayer} from '../content';
import {BootstrapLayer} from './bootstrap.layer';
import {PersistenceLayer} from '../persistence';

export type Module<
    TParamDefs extends readonly ParamDef[],
    Params extends BuildParams<TParamDefs>
> = {
  name: string;
  paramDefs?: TParamDefs;
  layers: {
    content?: new (params: Params) => ContentLayer<Params>;
    bootstrap?: new (params: Params) => BootstrapLayer<Params>;
    persistence?: new (params: Params) => PersistenceLayer<Params>;
  }
}
