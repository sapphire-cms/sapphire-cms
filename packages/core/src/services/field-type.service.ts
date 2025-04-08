import {ContentLayer, getFieldTypeMetadataFromClass, ManagementLayer, SapphireFieldTypeClass} from '../layers';
import {FieldTypeParamsSchema, FieldTypeSchema} from '../loadables';
import {IValidator} from '../common';
import {inject, singleton} from 'tsyringe';
import {DI_TOKENS} from '../kernel';

@singleton()
export class FieldTypeService {
  private readonly fieldTypeFactories = new Map<string, SapphireFieldTypeClass<any, any>>();
  private readonly typesCache = new Map<string, IValidator<any>>();

  constructor(@inject(DI_TOKENS.ContentLayer) contentLayer: ContentLayer<any>,
              @inject(DI_TOKENS.ManagementLayer) managementLayer: ManagementLayer<any>) {
    contentLayer.fieldTypeFactories?.forEach(typeFactory => {
      const metadata = getFieldTypeMetadataFromClass(typeFactory);
      if (metadata) {
        this.fieldTypeFactories.set(metadata.name, typeFactory);
      }
    });

    managementLayer.getTypeFactoriesPort.accept(async () => {
      return Object.freeze(new Map(this.fieldTypeFactories));
    });
  }

  public resolveFieldType(fieldType: string | FieldTypeSchema): IValidator<any> {
    let typeName: string;
    let params: FieldTypeParamsSchema;

    if (typeof fieldType === 'string') {
      typeName = fieldType;
      params = {};
    } else {
      typeName = fieldType.name;
      params = fieldType.params || {};
    }

    // Check the cache
    if (!Object.keys(params).length && this.typesCache.has(typeName)) {
      return this.typesCache.get(typeName)!;
    }

    const typeFactory = this.fieldTypeFactories.get(typeName);
    if (!typeFactory) {
      throw new Error(`Unknown field type: "${typeName}"`);
    }

    const resolvedType = new typeFactory(params);

    // Put the type in cache
    if (!Object.keys(params).length) {
      this.typesCache.set(typeName, resolvedType);
    }

    return resolvedType;
  }
}
