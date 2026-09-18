import { failure, Outcome, Program, program, success, SyncOutcome, SyncProgram } from 'defectless';
import { deepClone } from '../common';
import { CoreCmsError, ModuleReference, ShaperError } from '../kernel';
import { FieldShaper, FieldShaperFactory } from '../layers';
import {
  DocumentContentInlined,
  DocumentShapingError,
  FieldSchema,
  HydratedContentSchema,
  RecursiveValue,
  ScalarValue,
  ShaperSchema,
  UnknownFieldShaperError,
} from '../model';

export class DocumentShaper {
  public static create(
    shaperSchema: ShaperSchema,
    contentSchema: HydratedContentSchema,
    fieldShaperFactories: Map<ModuleReference, FieldShaperFactory>,
  ): SyncOutcome<DocumentShaper, UnknownFieldShaperError | CoreCmsError> {
    return program(function* (): SyncProgram<
      DocumentShaper,
      UnknownFieldShaperError | CoreCmsError
    > {
      const fieldPipelines = new Map<string, FieldShaper[]>();

      for (const fieldPipelineSchema of shaperSchema.fields) {
        const fieldShapers: FieldShaper[] = [];

        for (const fieldShaperSchema of fieldPipelineSchema.shapers) {
          const factory = fieldShaperFactories.get(
            fieldShaperSchema.fieldShaper as ModuleReference,
          );

          if (!factory) {
            return failure(new UnknownFieldShaperError(fieldShaperSchema.fieldShaper));
          }

          const shaper = yield Outcome.fromSupplier(
            () => factory.instance(fieldShaperSchema.params),
            (err) =>
              new CoreCmsError(
                `Failed to instantiate shaper ${fieldShaperSchema.fieldShaper}`,
                err,
              ),
          );

          fieldShapers.push(shaper);
        }

        fieldPipelines.set(fieldPipelineSchema.source, fieldShapers);
      }

      return success(new DocumentShaper(contentSchema, fieldPipelines));
    });
  }

  private constructor(
    private readonly contentSchema: HydratedContentSchema,
    private readonly fieldPipelines: Map<string, FieldShaper[]>,
  ) {}

  public shapeDocument(
    documentContent: DocumentContentInlined,
  ): Outcome<DocumentContentInlined, DocumentShapingError | ShaperError> {
    return program(function* (): Program<
      DocumentContentInlined,
      DocumentShapingError | ShaperError
    > {
      const shaped: DocumentContentInlined = deepClone(documentContent);

      for (const fieldSchema of this.contentSchema.fields) {
        const fieldValue = shaped[fieldSchema.name];
        shaped[fieldSchema.name] = yield this.shapeField(fieldSchema, fieldValue);
      }

      return shaped;
    }, this);
  }

  private shapeField(
    fieldShema: FieldSchema,
    fieldValue: RecursiveValue,
  ): Outcome<RecursiveValue, DocumentShapingError | ShaperError> {
    const shapers: FieldShaper[] = this.fieldPipelines.get(fieldShema.name) || [];

    if (!shapers.length) {
      return success(fieldValue);
    }

    if (fieldShema.type.name === 'group') {
      return failure(new DocumentShapingError(`Cannot shape group field ${fieldShema.name}`));
    }

    return program(function* (): Program<RecursiveValue, DocumentShapingError | ShaperError> {
      if (Array.isArray(fieldValue) && fieldValue.length) {
        const result: ScalarValue[] = [];

        for (const item of fieldValue) {
          const processedItem: ScalarValue = yield DocumentShaper.processValue(
            item as ScalarValue,
            shapers,
          );
          result.push(processedItem);
        }

        return result;
      } else {
        return DocumentShaper.processValue(fieldValue as ScalarValue, shapers);
      }
    });
  }

  private static processValue(
    value: ScalarValue,
    shapers: FieldShaper[],
  ): Outcome<ScalarValue, DocumentShapingError | ShaperError> {
    return program(function* (): Program<ScalarValue, DocumentShapingError | ShaperError> {
      let processed: ScalarValue = value;
      let processedType: 'string' | 'number' | 'boolean' = typeof value as
        | 'string'
        | 'number'
        | 'boolean';

      for (const shaper of shapers) {
        if (!shaper.forTypes.includes(processedType)) {
          return failure(
            new DocumentShapingError(
              `Shaper ${shaper.name} cannot process value of type ${processedType}`,
            ),
          );
        }

        processed = yield shaper.transform(processed);
        processedType = typeof processed as 'string' | 'number' | 'boolean';
      }

      return processed;
    }, this);
  }
}
