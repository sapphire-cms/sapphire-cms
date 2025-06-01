import { failure, Outcome, program, success, SyncOutcome, SyncProgram } from 'defectless';
import { AnyParams } from '../common';
import { CoreCmsError, createModuleRef, ModuleReference, parseModuleRef } from '../kernel';
import {
  ContentLayer,
  DeliveryLayer,
  FieldTypeFactory,
  FieldValidatorFactory,
  RendererFactory,
  RenderLayer,
} from '../layers';
import {
  ContentSchema,
  createHiddenCollectionSchema,
  FieldSchema,
  FieldTypeSchema,
  FieldValidatorSchema,
  HydratedContentSchema,
  HydratedFieldSchema,
  IFieldType,
  IFieldValidator,
  PipelineSchema,
  UnknownContentTypeError,
  UnknownDeliveryLayerError,
  UnknownFieldTypeError,
  UnknownFieldValidatorError,
  UnknownRendererError,
} from '../model';
import { RenderPipeline } from './render-pipeline';

export class CmsContext {
  public readonly fieldTypeFactories = new Map<ModuleReference, FieldTypeFactory>();
  public readonly fieldValidatorFactories = new Map<ModuleReference, FieldValidatorFactory>();
  public readonly rendererFactories = new Map<ModuleReference, RendererFactory>();

  public readonly publicContentSchemas = new Map<string, ContentSchema>();
  public readonly publicHydratedContentSchemas = new Map<string, HydratedContentSchema>();
  public readonly hiddenHydratedContentSchemas = new Map<string, HydratedContentSchema>();

  public readonly renderPipelines = new Map<string, RenderPipeline>();

  constructor(
    public readonly contentLayers: Map<ModuleReference, ContentLayer<AnyParams>>,
    public readonly renderLayers: Map<ModuleReference, RenderLayer<AnyParams>>,
    public readonly deliveryLayers: Map<ModuleReference, DeliveryLayer<AnyParams>>,
    loadedContentSchemas: ContentSchema[],
    loadedPipelineSchemas: PipelineSchema[],
  ) {
    // Create field types and validators factories
    for (const [moduleRef, contentLayer] of contentLayers.entries()) {
      const module = parseModuleRef(moduleRef)[0];

      for (const fieldTypeClass of contentLayer.fieldTypeFactories || []) {
        const fieldTypeFactory = new FieldTypeFactory(fieldTypeClass);
        const typeRef = createModuleRef(module, fieldTypeFactory.name);
        this.fieldTypeFactories.set(typeRef, fieldTypeFactory);
      }

      for (const fieldValidatorClass of contentLayer.fieldValueValidatorFactories || []) {
        const fieldValidatorFactory = new FieldValidatorFactory(fieldValidatorClass);
        const validatorRef = createModuleRef(module, fieldValidatorFactory.name);
        this.fieldValidatorFactories.set(validatorRef, fieldValidatorFactory);
      }
    }

    // Create renderer factories
    for (const [moduleRef, renderLayer] of renderLayers.entries()) {
      for (const rendererClass of renderLayer.rendererFactories || []) {
        const rendererFactory = new RendererFactory(rendererClass);
        const module = parseModuleRef(moduleRef)[0];
        const rendererRef = createModuleRef(module, rendererFactory.name);
        this.rendererFactories.set(rendererRef, rendererFactory);
      }
    }

    // Create content schemas
    loadedContentSchemas.forEach((contentSchema) => {
      this.publicContentSchemas.set(contentSchema.name, contentSchema);

      this.hydrateContentSchema(contentSchema).match(
        (hydrated) => this.publicHydratedContentSchemas.set(hydrated.name, hydrated),
        (err) => {
          console.warn(`Failed to hydrate schema ${contentSchema.name}`, err);
        },
        (defect) => {
          console.error(defect);
        },
      );
    });

    loadedContentSchemas
      .flatMap((contentSchema) => CmsContext.createHiddenCollectionSchemas(contentSchema))
      .forEach((contentSchema) => {
        this.hydrateContentSchema(contentSchema).match(
          (hydrated) => this.hiddenHydratedContentSchemas.set(hydrated.name, hydrated),
          (err) => {
            console.warn(`Failed to hydrate schema ${contentSchema.name}`, err);
          },
          (defect) => {
            console.error(defect);
          },
        );
      });

    // Create rendering pipelines
    loadedPipelineSchemas.forEach((pipelineSchema) => {
      this.createRenderPipeline(pipelineSchema).match(
        (pipeline) => this.renderPipelines.set(pipeline.name, pipeline),
        (err) => {
          console.warn(`Failed to create rendering pipeline ${pipelineSchema.name}`, err);
        },
        (defect) => {
          console.error(defect);
        },
      );
    });
  }

  public get allContentSchemas(): Map<string, HydratedContentSchema> {
    return new Map([...this.hiddenHydratedContentSchemas, ...this.publicHydratedContentSchemas]);
  }

  public createFieldType(
    typeSchema: FieldTypeSchema,
  ): SyncOutcome<IFieldType, UnknownFieldTypeError> {
    const typeFactory = this.fieldTypeFactories.get(typeSchema.name as ModuleReference);
    return typeFactory
      ? success(typeFactory.instance(typeSchema.params))
      : failure(new UnknownFieldTypeError(typeSchema.name));
  }

  public createFieldValidator(
    validatorSchema: FieldValidatorSchema,
  ): SyncOutcome<IFieldValidator, UnknownFieldValidatorError> {
    const fieldValidatorFactory = this.fieldValidatorFactories.get(
      validatorSchema.name as ModuleReference,
    );
    return fieldValidatorFactory
      ? success(fieldValidatorFactory.instance(validatorSchema.params))
      : failure(new UnknownFieldValidatorError(validatorSchema.name));
  }

  private hydrateContentSchema(
    contentSchema: ContentSchema,
  ): SyncOutcome<HydratedContentSchema, CoreCmsError> {
    const hydrateFieldsTasks = contentSchema.fields.map((field) => this.hydrateFieldSchema(field));
    return Outcome.all(hydrateFieldsTasks)
      .map((fields) => {
        return {
          name: contentSchema.name,
          extends: contentSchema.extends,
          label: contentSchema.label,
          description: contentSchema.description,
          type: contentSchema.type,
          variants: contentSchema.variants,
          fields: fields,
        };
      })
      .mapFailure((errors) => {
        const message = errors
          .filter((error) => !!error)
          .map((error) => error?.message)
          .join('\n');
        return new CoreCmsError(message);
      });
  }

  private hydrateFieldSchema(
    fieldSchema: FieldSchema,
  ): SyncOutcome<HydratedFieldSchema, UnknownFieldTypeError | UnknownFieldValidatorError> {
    return program(function* (): SyncProgram<
      HydratedFieldSchema,
      UnknownFieldTypeError | UnknownFieldValidatorError
    > {
      const fieldType: IFieldType = yield this.createFieldType(fieldSchema.type);

      const fieldValidators: IFieldValidator[] = [];
      for (const validatorSchema of fieldSchema.validation) {
        const validator = yield this.createFieldValidator(validatorSchema);
        fieldValidators.push(validator);
      }

      const hydratedSubFields: HydratedFieldSchema[] = [];
      for (const subFieldSchema of fieldSchema.fields) {
        const subField = yield this.hydrateFieldSchema(subFieldSchema);
        hydratedSubFields.push(subField);
      }

      return {
        name: fieldSchema.name,
        label: fieldSchema.label,
        description: fieldSchema.description,
        example: fieldSchema.example,
        isList: fieldSchema.isList,
        required: fieldSchema.required,
        validation: fieldValidators,
        type: fieldType,
        fields: hydratedSubFields,
      };
    }, this);
  }

  private createRenderPipeline(
    pipelineSchema: PipelineSchema,
  ): SyncOutcome<
    RenderPipeline,
    UnknownContentTypeError | UnknownRendererError | UnknownDeliveryLayerError
  > {
    const contentSchema = this.publicHydratedContentSchemas.get(pipelineSchema.source);
    if (!contentSchema) {
      return failure(new UnknownContentTypeError(pipelineSchema.source));
    }

    const rendererFactory = this.rendererFactories.get(
      pipelineSchema.render.name as ModuleReference,
    );
    if (!rendererFactory) {
      return failure(new UnknownRendererError(pipelineSchema.render.name));
    }
    const renderer = rendererFactory.instance(pipelineSchema.render.params);

    const deliveryLayer = this.deliveryLayers.get(pipelineSchema.target as ModuleReference);
    if (!deliveryLayer) {
      return failure(new UnknownDeliveryLayerError(pipelineSchema.target));
    }

    return success(new RenderPipeline(pipelineSchema.name, contentSchema, renderer, deliveryLayer));
  }

  private static createHiddenCollectionSchemas(contentSchema: ContentSchema): ContentSchema[] {
    const groupFieldsSchemas: ContentSchema[] = [];

    for (const field of contentSchema.fields) {
      if (field.type.name === 'group') {
        const groupSchema: ContentSchema = createHiddenCollectionSchema(contentSchema, field);
        groupFieldsSchemas.push(groupSchema);
        groupFieldsSchemas.push(...this.createHiddenCollectionSchemas(groupSchema));
      }
    }

    return groupFieldsSchemas;
  }
}
