import {ContentLayer, FieldType, FieldTypeFactory, ManagementLayer} from '../layers';
import {inject, singleton} from 'tsyringe';
import {DI_TOKENS} from '../kernel';
import {FieldTypeSchema} from '../model';
import {IFieldType} from '../model/common/field-type';

@singleton()
export class FieldTypeService {
  public readonly fieldTypeFactories = new Map<string, FieldTypeFactory>();
  private readonly typesCache = new Map<string, FieldType<any>>();

  constructor(@inject(DI_TOKENS.ContentLayer) contentLayer: ContentLayer<any>,
              @inject(DI_TOKENS.ManagementLayer) managementLayer: ManagementLayer<any>) {
    contentLayer.fieldTypeFactories?.forEach(typeFactory => {
      const factory = new FieldTypeFactory(typeFactory);
      this.fieldTypeFactories.set(factory.name, factory);
    });
  }

  public resolveFieldType(fieldType: FieldTypeSchema): IFieldType<any> {
    // Check the cache
    if (!Object.keys(fieldType.params).length && this.typesCache.has(fieldType.name)) {
      return this.typesCache.get(fieldType.name)!;
    }

    const typeFactory = this.fieldTypeFactories.get(fieldType.name);
    if (!typeFactory) {
      throw new Error(`Unknown field type: "${fieldType.name}"`);
    }

    const resolvedType = typeFactory.instance(fieldType.params);

    // Put the type in cache
    if (!Object.keys(fieldType.params).length) {
      this.typesCache.set(fieldType.name, resolvedType);
    }

    return resolvedType;
  }
}
