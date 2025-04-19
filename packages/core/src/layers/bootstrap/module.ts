import {ModuleMetadata, SapphireModuleClass} from './bootstrap.types';
import {BuildParams, ParamDef} from '../../common';
import {ContentLayer} from '../content';
import {BootstrapLayer} from './bootstrap.layer';
import {PersistenceLayer} from '../persistence';
import {AdminLayer} from '../admin';
import {ManagementLayer} from '../management';
import {PlatformLayer} from '../platform';
import {RenderLayer} from '../render';
import {DeliveryLayer} from '../delivery';
import {Layer, Layers, LayerType} from '../../kernel';

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

function getModuleMetadata<
    T extends new (...args: any[]) => any
>(target: T): ModuleMetadata<any, any> | undefined {
  return ModuleRegistry.get(target);
}

export class Module {
  private layers = new Map<LayerType, Layer<any>>();

  constructor(private readonly metadata: ModuleMetadata<any, any>,
              private readonly params: any) {
  }

  public get name(): string {
    return this.metadata.name;
  }

  public get contentLayer(): ContentLayer<any> | undefined {
    return this.getLayer<ContentLayer<any>>(Layers.CONTENT);
  }

  public get bootstrapLayer(): BootstrapLayer<any> | undefined {
    return this.getLayer<BootstrapLayer<any>>(Layers.BOOTSTRAP);
  }

  public get persistenceLayer(): PersistenceLayer<any> | undefined {
    return this.getLayer<PersistenceLayer<any>>(Layers.PERSISTENCE);
  }

  public get adminLayer(): AdminLayer<any> | undefined {
    return this.getLayer<AdminLayer<any>>(Layers.ADMIN);
  }

  public get managementLayer(): ManagementLayer<any> | undefined {
    return this.getLayer<ManagementLayer<any>>(Layers.MANAGEMENT);
  }

  public get platformLayer(): PlatformLayer<any> | undefined {
    return this.getLayer<PlatformLayer<any>>(Layers.PLATFORM);
  }

  public get renderLayer(): RenderLayer<any> | undefined {
    return this.getLayer<RenderLayer<any>>(Layers.RENDER);
  }

  public get deliveryLayer(): DeliveryLayer<any> | undefined {
    return this.getLayer<DeliveryLayer<any>>(Layers.DELIVERY);
  }

  public getLayer<L extends Layer<any>>(layerType: LayerType): L {
    if (!this.layers.has(layerType) && this.metadata.layers[layerType]) {
      this.layers.set(layerType, new this.metadata.layers[layerType]!(this.params));
    }
    return this.layers.get(layerType) as L;
  }
}

export class ModuleFactory {
  private readonly metadata: ModuleMetadata<any, any>;

  public constructor(moduleClass: SapphireModuleClass<any, any>) {
    this.metadata = getModuleMetadata(moduleClass)!;
  }

  public get name(): string {
    return this.metadata.name;
  }

  public get params(): ParamDef[] {
    return this.metadata.params;
  }

  public providesLayer(layerType: LayerType): boolean {
    return !!this.metadata.layers[layerType];
  }

  public instance(params: any): Module {
    return new Module(this.metadata, params);
  }
}
