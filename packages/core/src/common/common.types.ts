export type ParamTypes = {
  string: string;
  number: number;
  boolean: boolean;
};

export type ParamDef<Name extends string = string> = {
  name: Name;
  description?: string;
  type: keyof ParamTypes;
  required?: boolean;
  isList?: boolean;
};

type ResolveParamType<F extends ParamDef> =
    F['isList'] extends true
        ? ParamTypes[F['type']][]
        : ParamTypes[F['type']];

export type BuildParams<T extends readonly ParamDef[]> = {
  [K in T[number] as K['name']]: K extends ParamDef ? ResolveParamType<K> : never;
};

export function getBuildParamsType<
    TParamDefs extends readonly ParamDef[],
    Params extends BuildParams<TParamDefs>
>(params: TParamDefs): Params {
  return null as unknown as Params;
}
