import {ModuleMetadata, SapphireModuleClass} from './bootstrap.types';
import {BuildParams, ParamDef} from '../../common';

const ModuleRegistry = new WeakMap<any, ModuleMetadata<any, any>>();

export function SapphireModule<
    TParamDefs extends readonly ParamDef[],
    TParams extends BuildParams<TParamDefs>
>(
    options: ModuleMetadata<TParamDefs, TParams>
) {
  return function <T extends SapphireModuleClass<TParamDefs, TParams>>(target: T) {
    ModuleRegistry.set(target, options);
    (target as any).__moduleMetadata = options; // ← brand it!
  };
}

export function getModuleMetadata<
    T extends new (...args: any[]) => any
>(target: T): ModuleMetadata<any, any> | undefined {
  return ModuleRegistry.get(target);
}
