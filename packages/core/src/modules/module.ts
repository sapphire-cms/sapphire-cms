import {ContentLayer} from '../layers/content.layer';
import {BootstrapLayer} from '../layers/bootstrap.layer';
import {PersistenceLayer} from '../layers/persistence.layer';

type ParamTypes = {
  string: string;
  number: number;
  boolean: boolean;
};

type ParamDef<Name extends string = string> = {
  name: Name;
  description: string;
  type: keyof ParamTypes;
  required?: boolean;
  isList?: boolean;
};

type ResolveParamType<F extends ParamDef> =
    F['isList'] extends true
        ? ParamTypes[F['type']][]
        : ParamTypes[F['type']];

type BuildParams<T extends readonly ParamDef[]> = {
  [K in T[number] as K['name']]: K extends ParamDef ? ResolveParamType<K> : never;
};

export function getBuildParamsType<
    TParamDefs extends readonly ParamDef[],
    Params extends BuildParams<TParamDefs>
>(paramDefs: TParamDefs): Params {
  return null as unknown as Params;
}

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
