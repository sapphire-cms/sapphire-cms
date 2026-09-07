export type ParamTypes = {
  string: string;
  number: number;
  boolean: boolean;
};

// Helper to map an array of keys to their types
type MapTypeArray<T extends readonly (keyof ParamTypes)[]> = ParamTypes[T[number]];

// Final conditional wrapper
export type ValueType<T extends readonly (keyof ParamTypes)[] | null> = T extends null
  ? string | number | boolean | null
  : MapTypeArray<Exclude<T, null>>;

export type AnyParamType = string | number | boolean;

export type ParamDef<Name extends string = string> = {
  name: Name;
  description?: string;
  type: keyof ParamTypes;
  required?: boolean;
  isList?: boolean;
};

type ResolveParamType<F extends ParamDef> = F['isList'] extends true
  ? ParamTypes[F['type']][]
  : ParamTypes[F['type']];

export type BuildParams<T extends readonly ParamDef[]> = {
  [K in T[number] as K['name']]: K extends ParamDef ? ResolveParamType<K> : never;
};

export type UnknownParamDefs = readonly ParamDef[];

export type AnyParams = Record<string, AnyParamType | AnyParamType[]>;

export function getBuildParamsType<
  TParamDefs extends readonly ParamDef[],
  Params extends BuildParams<TParamDefs>,
>(_paramDefs: TParamDefs): Params {
  return null as unknown as Params;
}
