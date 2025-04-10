import {inject, singleton} from 'tsyringe';
import {AfterInitAware, DI_TOKENS} from '../kernel';
import {BootstrapLayer, PersistenceLayer} from '../layers';
import {ContentSchema, createHiddenCollectionSchema} from '../loadables';

@singleton()
export class ContentSchemasLoaderService implements AfterInitAware {
  private readonly contentSchemasPromise: Promise<ContentSchema[]>;
  private resolveContentSchemas: ((value: (PromiseLike<ContentSchema[]> | ContentSchema[])) => void) | undefined = undefined;

  public constructor(@inject(DI_TOKENS.BootstrapLayer) private readonly bootstrap: BootstrapLayer<any>,
                     @inject(DI_TOKENS.PersistenceLayer) private readonly persistence: PersistenceLayer<any>) {
    this.contentSchemasPromise = new Promise<ContentSchema[]>(resolve => this.resolveContentSchemas = resolve);
  }

  public afterInit(): Promise<void> {
    const allContentSchemas: ContentSchema[] = [];

    return this.bootstrap.getAllContentSchemas().then(contentSchemas => {

      // Load content schemas
      for (const contentSchema of contentSchemas) {
        allContentSchemas.push(contentSchema);
        this.createHiddenCollectionSchemas(contentSchema)
            .forEach(schema => allContentSchemas.push(schema));
      }

      // Prepare stores
      const prepareStoresPromises = allContentSchemas
          .map(contentSchema => this.prepareRepo(contentSchema));
      return Promise.all(prepareStoresPromises);
    }).then(() => {
      this.resolveContentSchemas!(allContentSchemas);
    });
  }

  public getAllContentSchemas(): Promise<ContentSchema[]> {
    return this.contentSchemasPromise;
  }

  private createHiddenCollectionSchemas(contentSchema: ContentSchema): ContentSchema[] {
    const groupFieldsSchemas: ContentSchema[] = [];

    for (const field of contentSchema.fields) {
      if (field.type === 'group') {
        const groupSchema: ContentSchema = createHiddenCollectionSchema(contentSchema, field);
        groupFieldsSchemas.push(groupSchema);
        groupFieldsSchemas.push(...this.createHiddenCollectionSchemas(groupSchema));
      }
    }

    return groupFieldsSchemas;
  }

  private prepareRepo(contentSchema: ContentSchema): Promise<void> {
    switch (contentSchema.type) {
      case 'singleton':
        return this.persistence.prepareSingletonRepo(contentSchema);
      case 'collection':
        return this.persistence.prepareCollectionRepo(contentSchema);
      case 'tree':
        return this.persistence.prepareTreeRepo(contentSchema);
    }

    return Promise.resolve();
  }
}
