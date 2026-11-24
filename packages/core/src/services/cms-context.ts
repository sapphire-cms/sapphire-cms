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
  asId,
  capability,
  CapabilityReference,
  CapabilityReferenceKey,
  CoreCmsError,
  DEFAULT_MODULE_NAME,
  DEFAULT_MODULE_REF,
  Id,
  makeHiddenCollectionName,
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
  getStore,
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
import { DeclarativeDocumentShaper } from './declarative-document-shaper';
import { DocumentRenderPipeline } from './document-render-pipeline';

export class CmsContext implements AfterInitAware {
  public readonly fieldTypeFactories = new Map<CapabilityReferenceKey, FieldTypeFactory>();
  public readonly fieldValidatorFactories = new Map<
    CapabilityReferenceKey,
    FieldValidatorFactory
  >();
  public readonly fieldShaperFactories = new Map<CapabilityReferenceKey, FieldShaperFactory>();
  public readonly rendererFactories = new Map<CapabilityReferenceKey, RendererFactory>();

  public readonly publicContentSchemas = new Map<CapabilityReferenceKey, HydratedContentSchema>();
  public readonly hiddenContentSchemas = new Map<CapabilityReferenceKey, HydratedContentSchema>();
  public readonly storesContentSchemas = new Map<Id, HydratedContentSchema>();

  public readonly documentShapers = new Map<CapabilityReferenceKey, DocumentShaper>();
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
        this.publicContentSchemas.set(hydrated.ref.key, hydrated);
        this.storesContentSchemas.set(hydrated.store, hydrated);
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
        this.hiddenContentSchemas.set(hydrated.ref.key, hydrated);
        this.storesContentSchemas.set(hydrated.store, hydrated);
      }

      // Create declarative document shapers
      for (const shaperSchema of this.loadedShaperSchemas) {
        const contentSchema = this.publicContentSchemas.get(shaperSchema.for);

        if (!contentSchema) {
          return failure(new UnknownContentTypeError(shaperSchema.for));
        }

        const documentShaper: DeclarativeDocumentShaper = yield DeclarativeDocumentShaper.create(
          shaperSchema,
          contentSchema!,
          this.fieldShaperFactories,
        );
        const documentShaperRef = DEFAULT_MODULE_REF.withCapability(shaperSchema.name);
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
            this.publicContentSchemas,
            this.rendererFactories,
            this.deliveryLayers,
            this.documentShapers,
          );
          this.renderPipelines.set(pipeline.name, pipeline);
        }
      }
    }, this);
  }

  public get allContentSchemas(): Map<CapabilityReferenceKey, HydratedContentSchema> {
    return new Map([...this.hiddenContentSchemas, ...this.publicContentSchemas]);
  }

  private createFieldType(
    contentSchema: ContentSchema,
    fieldSchema: FieldSchema,
  ): SyncOutcome<IFieldType, UnknownFieldTypeError | CoreCmsError> {
    const typeFactory = this.fieldTypeFactories.get(fieldSchema.type.name);

    let params: AnyParams;

    if (fieldSchema.type.name === 'group') {
      params = {
        'hidden-collection': makeHiddenCollectionName(contentSchema.name, fieldSchema.name),
      };
    } else if (fieldSchema.type.name === 'reference') {
      let storeRef = CapabilityReference.parse(fieldSchema.type.params['store'] as string);
      if (storeRef.module === DEFAULT_MODULE_NAME) {
        storeRef = new CapabilityReference(contentSchema.preset, storeRef.capability);
      }

      params = {
        store: storeRef.key,
      };
    } else {
      params = fieldSchema.type.params;
    }

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
          ref: new CapabilityReference(contentSchema.preset, contentSchema.name),
          dry: contentSchema,
          extends: contentSchema.extends
            ? CapabilityReference.parse(contentSchema.extends)
            : undefined,
          store: getStore(contentSchema),
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
          name: capability`required`,
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
