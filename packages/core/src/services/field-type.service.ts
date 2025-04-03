import {ContentLayer, FieldType, FieldTypeFactory} from '../layers/content';
import {FieldTypeParamsSchema, FieldTypeSchema} from '../loadables';

export class FieldTypeService {
  private readonly typeFactories = new Map<string, FieldTypeFactory<any, any>>();

  constructor(contentLayer: ContentLayer<any>) {
    contentLayer.fieldTypeFactories?.forEach(typeFactory => {
      this.typeFactories.set(typeFactory.name, typeFactory);
    });
  }

  // TODO: cache types
  public resolveFieldType(fieldType: string | FieldTypeSchema): FieldType<any, any> {
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

    return typeFactory.createType(params);
  }
}
