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
import { AnyParams, asId, Id } from '../common';
import {
  AfterInitAware,
  CoreCmsError,
  DEFAULT_MODULE_REF,
  moduleRef,
  ModuleReference,
  ModuleReferenceKey,
} from '../kernel';
import {
  ContentLayer,
  DeliveryLayer,
  DocumentShaper,
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
  FieldValidatorSchema,
  HydratedContentSchema,
  HydratedFieldSchema,
  IFieldType,
  IFieldValidator,
  makeHiddenCollectionName,
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
import { DeclarativeDocumentShaper } from './declarative-document-shaper';
import { DocumentRenderPipeline } from './document-render-pipeline';

export class CmsContext implements AfterInitAware {
  public readonly fieldTypeFactories = new Map<ModuleReferenceKey, FieldTypeFactory>();
  public readonly fieldValidatorFactories = new Map<ModuleReferenceKey, FieldValidatorFactory>();
  public readonly fieldShaperFactories = new Map<ModuleReferenceKey, FieldShaperFactory>();
  public readonly rendererFactories = new Map<ModuleReferenceKey, RendererFactory>();

  public readonly publicContentSchemas = new Map<ModuleReferenceKey, ContentSchema>();
  public readonly publicHydratedContentSchemas = new Map<
    ModuleReferenceKey,
    HydratedContentSchema
  >();
  public readonly hiddenHydratedContentSchemas = new Map<
    ModuleReferenceKey,
    HydratedContentSchema
  >();

  public readonly documentShapers = new Map<ModuleReferenceKey, DocumentShaper>();
  public readonly renderPipelines = new Map<Id, DocumentRenderPipeline>();
  public readonly contentMapRenderPipelines = new Map<Id, ContentMapRenderPipeline>();

  constructor(
    public readonly contentLayers: Map<ModuleReferenceKey, ContentLayer<AnyParams>>,
    public readonly renderLayers: Map<ModuleReferenceKey, RenderLayer<AnyParams>>,
    public readonly deliveryLayers: Map<ModuleReferenceKey, DeliveryLayer<AnyParams>>,
    public readonly shaperLayers: Map<ModuleReferenceKey, ShaperLayer<AnyParams>>,
    private readonly loadedContentSchemas: ContentSchema[],
    private readonly loadedPipelineSchemas: PipelineSchema[],
    private readonly loadedShaperSchemas: ShaperSchema[],
  ) {
    // Create field types and validators factories
    for (const [moduleRefKey, contentLayer] of contentLayers.entries()) {
      for (const fieldTypeClass of contentLayer.fieldTypeFactories || []) {
        const fieldTypeFactory = new FieldTypeFactory(
          ModuleReference.parse(moduleRefKey),
          fieldTypeClass,
        );
        this.fieldTypeFactories.set(fieldTypeFactory.ref.key, fieldTypeFactory);
      }

      for (const fieldValidatorClass of contentLayer.fieldValueValidatorFactories || []) {
        const fieldValidatorFactory = new FieldValidatorFactory(
          ModuleReference.parse(moduleRefKey),
          fieldValidatorClass,
        );
        this.fieldValidatorFactories.set(fieldValidatorFactory.ref.key, fieldValidatorFactory);
      }
    }

    for (const [moduleRefKey, shaperLayer] of shaperLayers.entries()) {
      const moduleRef = ModuleReference.parse(moduleRefKey);

      // Create field shaper factories
      for (const fieldShaperClass of shaperLayer.fieldShaperFactories) {
        const fieldShaperFactory = new FieldShaperFactory(moduleRef, fieldShaperClass);
        this.fieldShaperFactories.set(fieldShaperFactory.ref.key, fieldShaperFactory);
      }

      for (const [shaperName, shaper] of shaperLayer.documentShapers.entries()) {
        const shaperRef = moduleRef.withCapability(asId(shaperName));
        this.documentShapers.set(shaperRef.key, shaper);
      }
    }

    // Create renderer factories
    for (const [moduleRefKey, renderLayer] of renderLayers.entries()) {
      const moduleRef = ModuleReference.parse(moduleRefKey);

      for (const rendererClass of renderLayer.rendererFactories || []) {
        const rendererFactory = new RendererFactory(moduleRef, rendererClass);
        this.rendererFactories.set(rendererFactory.ref.key, rendererFactory);
      }
    }

    for (const contentSchema of this.loadedContentSchemas) {
      const contentSchemaRef = DEFAULT_MODULE_REF.withCapability(asId(contentSchema.name));
      this.publicContentSchemas.set(contentSchemaRef.key, contentSchema);
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
        this.publicHydratedContentSchemas.set(hydrated.ref.key, hydrated);
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
        this.hiddenHydratedContentSchemas.set(hydrated.ref.key, hydrated);
      }

      // Create declarative document shapers
      for (const shaperSchema of this.loadedShaperSchemas) {
        const contentSchema = this.publicHydratedContentSchemas.get(shaperSchema.for);

        if (!contentSchema) {
          return failure(new UnknownContentTypeError(shaperSchema.for));
        }

        const documentShaper: DeclarativeDocumentShaper = yield DeclarativeDocumentShaper.create(
          shaperSchema,
          contentSchema!,
          this.fieldShaperFactories,
        );
        const documentShaperRef = DEFAULT_MODULE_REF.withCapability(asId(shaperSchema.name));
        this.documentShapers.set(documentShaperRef.key, documentShaper);
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

  private createFieldType(
    contentSchema: ContentSchema,
    fieldSchema: FieldSchema,
  ): SyncOutcome<IFieldType, UnknownFieldTypeError | CoreCmsError> {
    const typeFactory = this.fieldTypeFactories.get(fieldSchema.type.name);

    const params: AnyParams =
      fieldSchema.type.name === 'group'
        ? {
            'hidden-collection': makeHiddenCollectionName(contentSchema.name, fieldSchema.name),
          }
        : fieldSchema.type.params;

    return typeFactory
      ? Outcome.fromSupplier(
          () => typeFactory.instance(params),
          (err) => new CoreCmsError(`Failed to instantiate field type ${typeFactory.ref}`, err),
        )
      : failure(new UnknownFieldTypeError(fieldSchema.type.name));
  }

  private createFieldValidator(
    validatorSchema: FieldValidatorSchema,
  ): SyncOutcome<IFieldValidator, UnknownFieldValidatorError | CoreCmsError> {
    const fieldValidatorFactory = this.fieldValidatorFactories.get(validatorSchema.name);
    return fieldValidatorFactory
      ? Outcome.fromSupplier(
          () => fieldValidatorFactory.instance(validatorSchema.params),
          (err) =>
            new CoreCmsError(
              `Failed to instantiate field validator ${fieldValidatorFactory.ref}`,
              err,
            ),
        )
      : failure(new UnknownFieldValidatorError(validatorSchema.name));
  }

  private hydrateContentSchema(
    contentSchema: ContentSchema,
  ): SyncOutcome<HydratedContentSchema, CoreCmsError> {
    const hydrateFieldsTasks = contentSchema.fields.map((field) =>
      this.hydrateFieldSchema(contentSchema, field),
    );
    return Outcome.all(hydrateFieldsTasks)
      .map((fields) => {
        return {
          ref: DEFAULT_MODULE_REF.withCapability(contentSchema.name),
          extends: contentSchema.extends ? ModuleReference.parse(contentSchema.extends) : undefined,
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
    contentSchema: ContentSchema,
    fieldSchema: FieldSchema,
  ): SyncOutcome<
    HydratedFieldSchema,
    UnknownFieldTypeError | UnknownFieldValidatorError | CoreCmsError
  > {
    return program(function* (): SyncProgram<
      HydratedFieldSchema,
      UnknownFieldTypeError | UnknownFieldValidatorError | CoreCmsError
    > {
      const fieldType: IFieldType = yield this.createFieldType(contentSchema, fieldSchema);

      const fieldValidators: IFieldValidator[] = [];

      if (fieldSchema.required) {
        const requiredValidator = yield this.createFieldValidator({
          name: moduleRef`required`,
          params: {},
        });
        fieldValidators.push(requiredValidator);
      }

      for (const validatorSchema of fieldSchema.validation) {
        const validator: IFieldValidator = yield this.createFieldValidator(validatorSchema);

        if (validator.forTypes.includes(fieldType.castTo)) {
          fieldValidators.push(validator);
        } else {
          return failure(
            new CoreCmsError(
              `Validator ${validator.ref.key} cannot be applied on the field ${fieldSchema.name} of type ${fieldType.ref}`,
            ),
          );
        }
      }

      const hydratedSubFields: HydratedFieldSchema[] = [];
      for (const subFieldSchema of fieldSchema.fields) {
        const subField = yield this.hydrateFieldSchema(contentSchema, subFieldSchema);
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
