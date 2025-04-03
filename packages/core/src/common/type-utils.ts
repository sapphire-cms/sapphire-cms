import {BuildParams, ParamDef} from './common.types';

export function getBuildParamsType<
    TParamDefs extends readonly ParamDef[],
    Params extends BuildParams<TParamDefs>
>(paramDefs: TParamDefs): Params {
  return null as unknown as Params;
}
