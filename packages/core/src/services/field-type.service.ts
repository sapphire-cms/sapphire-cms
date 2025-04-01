import {ContentLayer} from '../layers/content.layer';
import {FieldType, FieldTypeFactory} from '../model/field-type';
import {FieldTypeParams, FieldTypeSchema} from '../model/content-schema';

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
    let params: FieldTypeParams;

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
