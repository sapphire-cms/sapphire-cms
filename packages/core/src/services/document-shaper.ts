import { Outcome, Program, program, success } from 'defectless';
import { AnyParamType, deepClone } from '../common';
import { ModuleReference, ShaperError } from '../kernel';
import { FieldShaper, FieldShaperFactory } from '../layers';
import {
  DocumentContentInlined,
  DocumentShapingError,
  HydratedContentSchema,
  RecursiveValue,
  ShaperSchema,
} from '../model';

export class DocumentShaper {
  private readonly fieldPipelines = new Map<string, FieldShaper[]>();

  constructor(
    private readonly shaperSchema: ShaperSchema,
    private readonly contentSchema: HydratedContentSchema,
    fieldShaperFactories: Map<ModuleReference, FieldShaperFactory>,
  ) {
    for (const fieldPipelineSchema of this.shaperSchema.fields) {
      const fieldShapers: FieldShaper[] = [];

      for (const fieldShaperSchema of fieldPipelineSchema.shapers) {
        const factory = fieldShaperFactories.get(fieldShaperSchema.fieldShaper as ModuleReference);

        // TODO: check that factory is not undefined

        const shaper = factory!.instance(fieldShaperSchema.params);
        fieldShapers.push(shaper);
      }

      this.fieldPipelines.set(fieldPipelineSchema.source, fieldShapers);
    }
  }

  public shapeDocument(
    documentContent: DocumentContentInlined,
  ): Outcome<DocumentContentInlined, DocumentShapingError | ShaperError> {
    return program(function* (): Program<
      DocumentContentInlined,
      DocumentShapingError | ShaperError
    > {
      const shaped: DocumentContentInlined = deepClone(documentContent);

      for (const fieldSchema of this.contentSchema.fields) {
        const fieldName = fieldSchema.name;
        const fieldValue = shaped[fieldName];
        shaped[fieldName] = yield this.processField(fieldName, fieldValue);
      }

      return success(shaped);
    }, this);
  }

  private processField(
    fieldName: string,
    fieldValue: RecursiveValue,
  ): Outcome<RecursiveValue, ShaperError> {
    return program(function* (): Program<RecursiveValue, ShaperError> {
      let value: AnyParamType = fieldValue as AnyParamType;

      for (const shaper of this.fieldPipelines.get(fieldName) || []) {
        value = yield shaper.transform(value);
      }

      return value as RecursiveValue;
    }, this);
  }
}
