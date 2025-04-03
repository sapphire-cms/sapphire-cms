import {BuildParams, ParamDef} from '../../common';
import {ContentLayer} from '../content';
import {BootstrapLayer} from './bootstrap.layer';
import {Module} from './bootstrap.types';
import {PersistenceLayer} from '../persistence';

// TODO: try annotation driven declaration @Module something
export function defineModule<
    TypeName extends string,
    TParamDefs extends readonly ParamDef[],
    TBuildParams extends BuildParams<TParamDefs>,
    TContentLayer extends ContentLayer<TBuildParams>,
    TBootstrapLayer extends BootstrapLayer<TBuildParams>,
    TPersistenceLayer extends PersistenceLayer<TBuildParams>
>(
    name: TypeName,
    paramDefs: TParamDefs,
    layers: {
      content?: new (params: TBuildParams) => TContentLayer,
      bootstrap?: new (params: TBuildParams) => TBootstrapLayer,
      persistence?: new (params: TBuildParams) => TPersistenceLayer,
    }
): Module<TParamDefs, TBuildParams> {
  return {
    name,
    paramDefs,
    layers,
  };
}
