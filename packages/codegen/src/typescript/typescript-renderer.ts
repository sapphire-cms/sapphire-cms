import {
  Artifact,
  ContentMap,
  ContentSchema,
  Document, DocumentMap,
  FieldSchema,
  getFieldTypeMetadataFromClass,
  Renderer,
  SapphireFieldTypeClass,
  SapphireRenderer
} from '@sapphire-cms/core';
import {capitalize, kebabToCamel} from '../utils';

@SapphireRenderer({
  name: 'typescript',
  paramDefs: [] as const,
})
export class TypescriptRenderer implements Renderer {
  public renderDocument(document: Document<any>): Promise<Artifact[]> {
    // TODO: create an abstract renderer with method documentSlug
    const slug = [
      document.store,
      ...document.path,
      document.id,
      document.variant,
    ].join('/');

    const typescriptCode = TypescriptRenderer.genDocument(document);
    const content = new TextEncoder().encode(typescriptCode);

    return Promise.resolve([{
      slug,
      createdAt: document.createdAt,
      lastModifiedAt: document.lastModifiedAt,
      mime: 'application/typescript',
      content,
      isMain: true,
    }]);
  }

  public renderContentMap(contentMap: ContentMap, contentSchemas: ContentSchema[], fieldTypeFactories: Map<string, SapphireFieldTypeClass<any, any>>): Promise<Artifact[]> {
    const renderedTypes: Artifact[] = [];
    const now = new Date().toISOString();

    // Generate types of documents
    for (const contentSchema of contentSchemas) {
      const documentType = TypescriptRenderer.getDocumentType(contentSchema, fieldTypeFactories);
      const content = new TextEncoder().encode(documentType);

      renderedTypes.push({
        slug: `${contentSchema.name}/${contentSchema.name}.types`,
        createdAt: now,
        lastModifiedAt: now,
        mime: 'application/typescript',
        content,
        isMain: false,
      });
    }

    // Generate index.ts files
    for (const [store, storeMap] of Object.entries(contentMap.stores)) {
      for (const [slug, docMap] of Object.entries(storeMap.documents)) {
        const barrel = TypescriptRenderer.generateDocumentBarrel(docMap);
        const content = new TextEncoder().encode(barrel);

        renderedTypes.push({
          slug: `${store}/${slug}/index`,
          createdAt: now,
          lastModifiedAt: now,
          mime: 'application/typescript',
          content,
          isMain: false,
        });
      }
    }

    return Promise.resolve(renderedTypes);
  }

  private static genDocument(document: Document<any>): string {
    const id = kebabToCamel(document.id) + '_' + kebabToCamel(document.variant);
    const objectType = capitalize(kebabToCamel(document.store));
    const typePath = [ ...document.path, document.id ].map(ignored => '..').join('/')
        + `/${document.store}`;
    const importLine = `import {${objectType}} from "${typePath}";`;

    return `${importLine}\n\nexport const ${id}: ${objectType} = `
        + JSON.stringify(document.content, null, 2)
        + ';\n';
  }

  // TODO: create an hydrated version of content schema
  private static getDocumentType(contentSchema: ContentSchema, fieldTypeFactories: Map<string, SapphireFieldTypeClass<any, any>>): string {
    const typeName = capitalize(kebabToCamel(contentSchema.name));

    let tsCode = `export type ${typeName} = `;
    tsCode += TypescriptRenderer.renderObjectValue(contentSchema, fieldTypeFactories);
    tsCode += ';\n';

    return tsCode;
  }

  private static renderObjectKey(key: string): string {
    return key.includes('-') ? `"${key}"` : key;
  }

  private static renderObjectValue(obj: ContentSchema | FieldSchema, fieldTypeFactories: Map<string, SapphireFieldTypeClass<any, any>>, indent = 0): string {
    let tsCode = '{\n';

    for (const field of obj.fields!) {
      tsCode += ' '.repeat(indent + 2) + `${ TypescriptRenderer.renderObjectKey(field.name) }`;

      if (!field.required) {
        tsCode += '?';
      }

      tsCode += ': ';

      if (field.type != 'group') {
        const fieldType = typeof field.type === 'string' ? field.type : field.type.name;
        const fieldTypeFactory = fieldTypeFactories.get(fieldType);
        if (!fieldTypeFactory) {
          throw new Error(`Unknown field type: "${field.type}"`);
        }
        const meta = getFieldTypeMetadataFromClass(fieldTypeFactory);

        tsCode += meta!.castTo;
      } else {
        tsCode += TypescriptRenderer.renderObjectValue(field, fieldTypeFactories, indent + 2);
      }

      if (field.isList) {
        tsCode += '[]';
      }

      tsCode += ';\n';
    }

    tsCode += ' '.repeat(indent) + '}';
    return tsCode;
  }

  private static generateDocumentBarrel(docMap: DocumentMap): string {
    let tsCode = '';

    for (const [variant, variantMap] of Object.entries(docMap.variants)) {
      if (variantMap) {
        const constName = kebabToCamel(docMap.docId) + '_' + kebabToCamel(variantMap.variant);
        const asDefault = variant === 'default' ? ' as default' : '';
        tsCode += `export {${constName}${asDefault}} from "./${variantMap.variant}";\n`;
      }
    }

    return tsCode;
  }
}
