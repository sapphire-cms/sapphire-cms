import {FieldType} from '../layers';
import {inject, singleton} from 'tsyringe';
import {FieldTypeSchema, IFieldType} from '../model';
import {CmsContext} from './cms-context';
import {ModuleReference} from '../kernel';

@singleton()
export class FieldTypeService {
  private readonly typesCache = new Map<string, FieldType<any>>();

  constructor(@inject(CmsContext) private readonly cmsContext: CmsContext) {
  }

  public resolveFieldType(fieldType: FieldTypeSchema): IFieldType<any> {
    // Check the cache
    if (!Object.keys(fieldType.params).length && this.typesCache.has(fieldType.name)) {
      return this.typesCache.get(fieldType.name)!;
    }

    const typeFactory = this.cmsContext.fieldTypeFactories.get(fieldType.name as ModuleReference);
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
