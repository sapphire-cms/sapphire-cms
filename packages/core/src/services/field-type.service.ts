import {ContentLayer} from '../layers/content';
import {FieldTypeParamsSchema, FieldTypeSchema} from '../loadables';
import {SapphireFieldTypeClass} from '../layers/content/fields-typing.types';
import {getFieldTypeMetadataFromClass} from '../layers/content/fields-typing';
import {IValidator} from '../common';
import {inject, singleton} from 'tsyringe';
import {DI_TOKENS} from '../kernel';

@singleton()
export class FieldTypeService {
  private readonly typeFactories = new Map<string, SapphireFieldTypeClass<any, any>>();

  constructor(@inject(DI_TOKENS.ContentLayer) contentLayer: ContentLayer<any>) {
    contentLayer.fieldTypeFactories?.forEach(typeFactory => {
      const metadata = getFieldTypeMetadataFromClass(typeFactory);
      this.typeFactories.set(metadata!.name, typeFactory);
    });
  }

  // TODO: cache types
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

    const typeFactory = this.typeFactories.get(typeName);
    if (!typeFactory) {
      throw new Error(`Unknown field type: "${typeName}"`);
    }

    return new typeFactory(params);
  }
}
