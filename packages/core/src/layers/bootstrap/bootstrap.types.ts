import {BuildParams, ParamDef} from '../../common';
import {ContentLayer} from '../content';
import {BootstrapLayer} from './bootstrap.layer';
import {PersistenceLayer} from '../persistence';
import {AdminLayer} from '../admin';
import {ManagementLayer} from '../management';
import {PlatformLayer} from '../platform';
import {RenderLayer} from '../render';
import {DeliveryLayer} from '../delivery';

export type ModuleMetadata<
    TParamDefs extends readonly ParamDef[],
    TParams extends BuildParams<TParamDefs>
> = {
  name: string;
  params: TParamDefs;
  layers: {
    content?: new (params: TParams) => ContentLayer<TParams>;
    bootstrap?: new (params: TParams) => BootstrapLayer<TParams>;
    persistence?: new (params: TParams) => PersistenceLayer<TParams>;
    admin?: new (params: TParams) => AdminLayer<TParams>;
    management?: new (params: TParams) => ManagementLayer<TParams>;
    platform?: new (params: TParams) => PlatformLayer<TParams>;
    // TODO: allow multiple render layers
    render?: new (params: TParams) => RenderLayer<TParams>;
    // TODO: allow multiple delivery layers
    delivery?: new (params: TParams) => DeliveryLayer<TParams>;
  };
};

export interface SapphireModuleClass<
    TParamDefs extends readonly ParamDef[],
    TParams extends BuildParams<TParamDefs>
> {
  new (...args: any[]): any;
  __moduleMetadata?: ModuleMetadata<TParamDefs, TParams>;
}
