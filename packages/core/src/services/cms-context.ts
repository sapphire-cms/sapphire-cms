import { failure, Outcome, success } from 'defectless';
import { AnyParams } from '../common';
import { BootstrapError, createModuleRef, ModuleReference, parseModuleRef } from '../kernel';
import {
  ContentLayer,
  DeliveryLayer,
  FieldTypeFactory,
  RendererFactory,
  RenderLayer,
} from '../layers';
import {
  ContentSchema,
  createHiddenCollectionSchema,
  FieldSchema,
  FieldTypeSchema,
  HydratedContentSchema,
  HydratedFieldSchema,
  IFieldType,
  PipelineSchema,
} from '../model';
import { RenderPipeline } from './render-pipeline';

export class CmsContext {
  public readonly fieldTypeFactories = new Map<ModuleReference, FieldTypeFactory>();
  // TODO: add fieldValidators
  public readonly rendererFactories = new Map<ModuleReference, RendererFactory>();

  public readonly publicContentSchemas = new Map<string, HydratedContentSchema>();
  public readonly hiddenContentSchemas = new Map<string, HydratedContentSchema>();

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
      for (const fieldTypeClass of contentLayer.fieldTypeFactories || []) {
        const fieldTypeFactory = new FieldTypeFactory(fieldTypeClass);
        const module = parseModuleRef(moduleRef)[0];
        const typeRef = createModuleRef(module, fieldTypeFactory.name);
        this.fieldTypeFactories.set(typeRef, fieldTypeFactory);
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
      this.hydrateContentSchema(contentSchema).match(
        (hydrated) => this.publicContentSchemas.set(hydrated.name, hydrated),
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
          (hydrated) => this.hiddenContentSchemas.set(hydrated.name, hydrated),
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
    return new Map([...this.hiddenContentSchemas, ...this.publicContentSchemas]);
  }

  public createFieldType(fieldType: FieldTypeSchema): Outcome<IFieldType, BootstrapError> {
    const typeFactory = this.fieldTypeFactories.get(fieldType.name as ModuleReference);
    if (!typeFactory) {
      return failure(new BootstrapError(`Unknown field type: "${fieldType.name}"`));
    }

    return success(typeFactory.instance(fieldType.params));
  }

  private hydrateContentSchema(
    contentSchema: ContentSchema,
  ): Outcome<HydratedContentSchema, BootstrapError> {
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
        return new BootstrapError(message);
      });
  }

  private hydrateFieldSchema(
    fieldSchema: FieldSchema,
  ): Outcome<HydratedFieldSchema, BootstrapError> {
    return this.createFieldType(fieldSchema.type).flatMap((fieldType) => {
      const hydrateFieldsTasks = fieldSchema.fields.map((field) => this.hydrateFieldSchema(field));
      return Outcome.all(hydrateFieldsTasks)
        .map((subFields) => {
          return {
            name: fieldSchema.name,
            label: fieldSchema.label,
            description: fieldSchema.description,
            example: fieldSchema.example,
            isList: fieldSchema.isList,
            required: fieldSchema.required,
            validation: fieldSchema.validation, // TODO: map validators
            type: fieldType,
            fields: subFields,
          };
        })
        .mapFailure((errors) => {
          const message = errors
            .filter((error) => !!error)
            .map((error) => error?.message)
            .join('\n');
          return new BootstrapError(message);
        });
    });
  }

  private createRenderPipeline(
    pipelineSchema: PipelineSchema,
  ): Outcome<RenderPipeline, BootstrapError> {
    const contentSchema = this.publicContentSchemas.get(pipelineSchema.source);
    if (!contentSchema) {
      return failure(new BootstrapError(`Unknown source: "${pipelineSchema.source}"`));
    }

    const rendererFactory = this.rendererFactories.get(
      pipelineSchema.render.name as ModuleReference,
    );
    if (!rendererFactory) {
      return failure(new BootstrapError(`Unknown renderer: "${pipelineSchema.render.name}"`));
    }
    const renderer = rendererFactory.instance(pipelineSchema.render.params);

    const deliveryLayer = this.deliveryLayers.get(pipelineSchema.target as ModuleReference);
    if (!deliveryLayer) {
      return failure(new BootstrapError(`Unknown delivery layer: "${pipelineSchema.target}"`));
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
