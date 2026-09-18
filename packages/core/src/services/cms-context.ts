import { failure, Outcome, program, SyncOutcome, SyncProgram } from 'defectless';
import {
  artifactMap,
  cmsMedia,
  contentMap,
  documentMap,
  locationMap,
  storeMap,
  variantMap,
} from '../cms-stores';
import { AnyParams } from '../common';
import {
  AfterInitAware,
  CoreCmsError,
  createModuleRef,
  ModuleReference,
  parseModuleRef,
} from '../kernel';
import {
  ContentLayer,
  DeliveryLayer,
  FieldShaperFactory,
  FieldTypeFactory,
  FieldValidatorFactory,
  RendererFactory,
  RenderLayer,
  ShaperLayer,
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
  ShaperSchema,
  UnknownContentTypeError,
  UnknownDeliveryLayerError,
  UnknownDocumentShaperError,
  UnknownFieldShaperError,
  UnknownFieldTypeError,
  UnknownFieldValidatorError,
  UnknownRendererError,
} from '../model';
import { ContentMapRenderPipeline } from './content-map-render-pipeline';
import { DocumentRenderPipeline } from './document-render-pipeline';
import { DocumentShaper } from './document-shaper';

export class CmsContext implements AfterInitAware {
  public readonly fieldTypeFactories = new Map<ModuleReference, FieldTypeFactory>();
  public readonly fieldValidatorFactories = new Map<ModuleReference, FieldValidatorFactory>();
  public readonly fieldShaperFactories = new Map<ModuleReference, FieldShaperFactory>();
  public readonly rendererFactories = new Map<ModuleReference, RendererFactory>();

  public readonly publicContentSchemas = new Map<string, ContentSchema>();
  public readonly publicHydratedContentSchemas = new Map<string, HydratedContentSchema>();
  public readonly hiddenHydratedContentSchemas = new Map<string, HydratedContentSchema>();

  public readonly documentShapers = new Map<string, DocumentShaper>();
  public readonly renderPipelines = new Map<string, DocumentRenderPipeline>();
  public readonly contentMapRenderPipelines = new Map<string, ContentMapRenderPipeline>();

  constructor(
    public readonly contentLayers: Map<ModuleReference, ContentLayer<AnyParams>>,
    public readonly renderLayers: Map<ModuleReference, RenderLayer<AnyParams>>,
    public readonly deliveryLayers: Map<ModuleReference, DeliveryLayer<AnyParams>>,
    public readonly shaperLayers: Map<ModuleReference, ShaperLayer<AnyParams>>,
    private readonly loadedContentSchemas: ContentSchema[],
    private readonly loadedPipelineSchemas: PipelineSchema[],
    private readonly loadedShaperSchemas: ShaperSchema[],
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

    // Create field shaper factories
    for (const [moduleRef, shaperLayer] of shaperLayers.entries()) {
      const module = parseModuleRef(moduleRef)[0];

      for (const fieldShaperClass of shaperLayer.fieldShaperFactories) {
        const fieldShaperFactory = new FieldShaperFactory(fieldShaperClass);
        const shaperRef = createModuleRef(module, fieldShaperFactory.name);
        this.fieldShaperFactories.set(shaperRef, fieldShaperFactory);
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

    for (const contentSchema of this.loadedContentSchemas) {
      this.publicContentSchemas.set(contentSchema.name, contentSchema);
    }
  }

  public afterInit(): Outcome<
    void,
    | CoreCmsError
    | UnknownContentTypeError
    | UnknownRendererError
    | UnknownFieldShaperError
    | UnknownDocumentShaperError
    | UnknownDeliveryLayerError
  > {
    return program(function* (): SyncProgram<
      void,
      | CoreCmsError
      | UnknownContentTypeError
      | UnknownRendererError
      | UnknownFieldShaperError
      | UnknownDocumentShaperError
      | UnknownDeliveryLayerError
    > {
      // Create content schemas
      for (const contentSchema of this.loadedContentSchemas) {
        const hydrated: HydratedContentSchema = yield this.hydrateContentSchema(contentSchema);
        this.publicHydratedContentSchemas.set(hydrated.name, hydrated);
      }

      const hiddenCollectionSchemas = this.loadedContentSchemas.flatMap((contentSchema) =>
        CmsContext.createHiddenCollectionSchemas(contentSchema),
      );

      // Push hidden collection schemas
      hiddenCollectionSchemas.push(
        cmsMedia,
        ...CmsContext.createHiddenCollectionSchemas(cmsMedia),
        contentMap,
        storeMap,
        documentMap,
        variantMap,
        artifactMap,
        locationMap,
      );

      for (const contentSchema of hiddenCollectionSchemas) {
        const hydrated: HydratedContentSchema = yield this.hydrateContentSchema(contentSchema);
        this.hiddenHydratedContentSchemas.set(hydrated.name, hydrated);
      }

      // Create document shapers
      for (const shaperSchema of this.loadedShaperSchemas) {
        const contentSchema = this.publicHydratedContentSchemas.get(shaperSchema.for);

        if (!contentSchema) {
          return failure(new UnknownContentTypeError(shaperSchema.for));
        }

        const documentShaper = yield DocumentShaper.create(
          shaperSchema,
          contentSchema!,
          this.fieldShaperFactories,
        );
        this.documentShapers.set(shaperSchema.name, documentShaper);
      }

      for (const pipelineSchema of this.loadedPipelineSchemas) {
        if (pipelineSchema.source === 'content-map') {
          // Create content map rendering pipeline
          const pipeline: ContentMapRenderPipeline = yield ContentMapRenderPipeline.create(
            pipelineSchema,
            this.rendererFactories,
            this.deliveryLayers,
          );
          this.contentMapRenderPipelines.set(pipeline.name, pipeline);
        } else {
          // Create document rendering pipeline
          const pipeline: DocumentRenderPipeline = yield DocumentRenderPipeline.create(
            pipelineSchema,
            this.publicHydratedContentSchemas,
            this.rendererFactories,
            this.deliveryLayers,
            this.documentShapers,
          );
          this.renderPipelines.set(pipeline.name, pipeline);
        }
      }
    }, this);
  }

  public get allContentSchemas(): Map<string, HydratedContentSchema> {
    return new Map([...this.hiddenHydratedContentSchemas, ...this.publicHydratedContentSchemas]);
  }

  public createFieldType(
    typeSchema: FieldTypeSchema,
  ): SyncOutcome<IFieldType, UnknownFieldTypeError | CoreCmsError> {
    const typeFactory = this.fieldTypeFactories.get(typeSchema.name as ModuleReference);
    return typeFactory
      ? Outcome.fromSupplier(
          () => typeFactory.instance(typeSchema.params),
          (err) => new CoreCmsError(`Failed to instantiate field type ${typeFactory.name}`, err),
        )
      : failure(new UnknownFieldTypeError(typeSchema.name));
  }

  public createFieldValidator(
    validatorSchema: FieldValidatorSchema,
  ): SyncOutcome<IFieldValidator, UnknownFieldValidatorError | CoreCmsError> {
    const fieldValidatorFactory = this.fieldValidatorFactories.get(
      validatorSchema.name as ModuleReference,
    );
    return fieldValidatorFactory
      ? Outcome.fromSupplier(
          () => fieldValidatorFactory.instance(validatorSchema.params),
          (err) =>
            new CoreCmsError(
              `Failed to instantiate field validator ${fieldValidatorFactory.name}`,
              err,
            ),
        )
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
  ): SyncOutcome<
    HydratedFieldSchema,
    UnknownFieldTypeError | UnknownFieldValidatorError | CoreCmsError
  > {
    return program(function* (): SyncProgram<
      HydratedFieldSchema,
      UnknownFieldTypeError | UnknownFieldValidatorError | CoreCmsError
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
        index: fieldSchema.index,
        validation: fieldValidators,
        type: fieldType,
        fields: hydratedSubFields,
      };
    }, this);
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
