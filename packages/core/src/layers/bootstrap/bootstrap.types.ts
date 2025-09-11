import { BuildParams, ParamDef, UnknownParamDefs } from '../../common';
import { AdminLayer } from '../admin';
import { ContentLayer } from '../content';
import { DeliveryLayer } from '../delivery';
import { ManagementLayer } from '../management';
import { PersistenceLayer } from '../persistence';
import { PlatformLayer } from '../platform';
import { RenderLayer } from '../render';
import { SecurityLayer } from '../security';
import { BootstrapLayer } from './bootstrap.layer';

export type ModuleMetadata<
  TParamDefs extends readonly ParamDef[] = UnknownParamDefs,
  TParams extends BuildParams<TParamDefs> = BuildParams<TParamDefs>,
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
    render?: new (params: TParams) => RenderLayer<TParams>;
    delivery?: new (params: TParams) => DeliveryLayer<TParams>;
    security?: new (params: TParams) => SecurityLayer<unknown, TParams>;
  };
};

export interface SapphireModuleClass<
  TParamDefs extends readonly ParamDef[] = UnknownParamDefs,
  TParams extends BuildParams<TParamDefs> = BuildParams<TParamDefs>,
> {
  new (params: TParams): unknown;
  __moduleMetadata?: ModuleMetadata<TParamDefs, TParams>;
}
