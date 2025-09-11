import { AnyParams, BuildParams, ParamDef, UnknownParamDefs } from '../../common';
import { Layer, Layers, LayerType } from '../../kernel';
import { AdminLayer } from '../admin';
import { ContentLayer } from '../content';
import { DeliveryLayer } from '../delivery';
import { ManagementLayer } from '../management';
import { PersistenceLayer } from '../persistence';
import { PlatformLayer } from '../platform';
import { RenderLayer } from '../render';
import { SecurityLayer } from '../security';
import { BootstrapLayer } from './bootstrap.layer';
import { ModuleMetadata, SapphireModuleClass } from './bootstrap.types';

const ModuleRegistry = new WeakMap<SapphireModuleClass, ModuleMetadata>();

export function SapphireModule<
  TParamDefs extends readonly ParamDef[],
  TParams extends BuildParams<TParamDefs>,
>(
  options: ModuleMetadata<TParamDefs, TParams>,
): <T extends SapphireModuleClass<TParamDefs, TParams>>(target: T) => void {
  return <T extends SapphireModuleClass<TParamDefs, TParams>>(target: T) => {
    ModuleRegistry.set(
      target as unknown as SapphireModuleClass,
      options as unknown as ModuleMetadata,
    );
    target.__moduleMetadata = options; // brand it
  };
}

function getModuleMetadata<T extends SapphireModuleClass>(target: T): ModuleMetadata | undefined {
  return ModuleRegistry.get(target);
}

export class Module {
  private readonly layers = new Map<LayerType, Layer<AnyParams>>();

  constructor(
    private readonly metadata: ModuleMetadata,
    private readonly params?: AnyParams,
  ) {}

  public get name(): string {
    return this.metadata.name;
  }

  public get contentLayer(): ContentLayer<AnyParams> | undefined {
    return this.getLayer<ContentLayer<AnyParams>>(Layers.CONTENT);
  }

  public get bootstrapLayer(): BootstrapLayer<AnyParams> | undefined {
    return this.getLayer<BootstrapLayer<AnyParams>>(Layers.BOOTSTRAP);
  }

  public get persistenceLayer(): PersistenceLayer<AnyParams> | undefined {
    return this.getLayer<PersistenceLayer<AnyParams>>(Layers.PERSISTENCE);
  }

  public get adminLayer(): AdminLayer<AnyParams> | undefined {
    return this.getLayer<AdminLayer<AnyParams>>(Layers.ADMIN);
  }

  public get managementLayer(): ManagementLayer<AnyParams> | undefined {
    return this.getLayer<ManagementLayer<AnyParams>>(Layers.MANAGEMENT);
  }

  public get platformLayer(): PlatformLayer<AnyParams> | undefined {
    return this.getLayer<PlatformLayer<AnyParams>>(Layers.PLATFORM);
  }

  public get renderLayer(): RenderLayer<AnyParams> | undefined {
    return this.getLayer<RenderLayer<AnyParams>>(Layers.RENDER);
  }

  public get deliveryLayer(): DeliveryLayer<AnyParams> | undefined {
    return this.getLayer<DeliveryLayer<AnyParams>>(Layers.DELIVERY);
  }

  public get securityLayer(): SecurityLayer<unknown, AnyParams> | undefined {
    return this.getLayer<SecurityLayer<unknown, AnyParams>>(Layers.SECURITY);
  }

  public getLayer<L extends Layer<AnyParams>>(layerType: LayerType): L {
    if (!this.layers.has(layerType) && this.metadata.layers[layerType]) {
      this.layers.set(
        layerType,
        new this.metadata.layers[layerType]!(this.params as BuildParams<UnknownParamDefs>),
      );
    }
    return this.layers.get(layerType) as L;
  }
}

export class ModuleFactory {
  private readonly metadata: ModuleMetadata;

  constructor(moduleClass: SapphireModuleClass) {
    this.metadata = getModuleMetadata(moduleClass)!;
  }

  public get name(): string {
    return this.metadata.name;
  }

  public get params(): UnknownParamDefs {
    return this.metadata.params;
  }

  public get hasRequiredParams(): boolean {
    return this.metadata.params.some((param) => param.required);
  }

  public providesLayer(layerType: LayerType): boolean {
    return !!this.metadata.layers[layerType];
  }

  public instance(params?: AnyParams): Module {
    return new Module(this.metadata, params);
  }
}
