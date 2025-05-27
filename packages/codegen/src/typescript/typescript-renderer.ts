import {
  Artifact,
  ContentSchema,
  Document,
  DocumentMap,
  documentSlug,
  HydratedContentSchema,
  HydratedFieldSchema,
  IRenderer,
  RenderError,
  SapphireRenderer,
  StoreMap,
} from '@sapphire-cms/core';
import { Outcome, success } from 'defectless';
import { capitalize, kebabToCamel } from '../utils';

@SapphireRenderer({
  name: 'typescript',
  params: [] as const,
})
export class TypescriptRenderer implements IRenderer {
  public renderDocument(
    document: Document,
    _contentSchema: ContentSchema,
  ): Outcome<Artifact[], RenderError> {
    const slug = documentSlug(document);
    const typescriptCode = TypescriptRenderer.genDocument(document);
    const content = new TextEncoder().encode(typescriptCode);

    return success([
      {
        slug,
        createdAt: document.createdAt,
        lastModifiedAt: document.lastModifiedAt,
        mime: 'application/typescript',
        content,
        isMain: true,
      },
    ]);
  }

  public renderStoreMap(
    storeMap: StoreMap,
    contentSchema: HydratedContentSchema,
  ): Outcome<Artifact[], RenderError> {
    const renderedTypes: Artifact[] = [];
    const now = new Date().toISOString();

    // Generate document type
    const documentType = TypescriptRenderer.getDocumentType(contentSchema);
    const documentContent = new TextEncoder().encode(documentType);

    renderedTypes.push({
      slug: `${contentSchema.name}/${contentSchema.name}.types`,
      createdAt: now,
      lastModifiedAt: now,
      mime: 'application/typescript',
      content: documentContent,
      isMain: false,
    });

    // Generate index.ts files
    for (const [slug, docMap] of Object.entries(storeMap.documents)) {
      const barrel = TypescriptRenderer.generateDocumentBarrel(docMap);
      const barrelContent = new TextEncoder().encode(barrel);

      renderedTypes.push({
        slug: `${storeMap.store}/${slug}/index`,
        createdAt: now,
        lastModifiedAt: now,
        mime: 'application/typescript',
        content: barrelContent,
        isMain: false,
      });
    }

    // Generate barrel for the whole store
    const storeBarrel = TypescriptRenderer.generateStoreBarrel(storeMap);
    const barrelContent = new TextEncoder().encode(storeBarrel);

    renderedTypes.push({
      slug: `${storeMap.store}/index`,
      createdAt: now,
      lastModifiedAt: now,
      mime: 'application/typescript',
      content: barrelContent,
      isMain: false,
    });

    return success(renderedTypes);
  }

  private static genDocument(document: Document): string {
    const id = kebabToCamel(document.id) + '_' + kebabToCamel(document.variant);
    const objectType = capitalize(kebabToCamel(document.store));
    const typePath =
      [...document.path, document.id].map(() => '..').join('/') + `/${document.store}`;
    const importLine = `import {${objectType}} from "${typePath}.types";`;

    return (
      `${importLine}\n\nexport const ${id}: ${objectType} = ` +
      JSON.stringify(document.content, null, 2) +
      ';\n'
    );
  }

  private static getDocumentType(contentSchema: HydratedContentSchema): string {
    const typeName = capitalize(kebabToCamel(contentSchema.name));

    let tsCode = `export type ${typeName} = `;
    tsCode += TypescriptRenderer.renderObjectValue(contentSchema);
    tsCode += ';\n';

    return tsCode;
  }

  private static renderObjectKey(key: string): string {
    return key.includes('-') ? `"${key}"` : key;
  }

  private static renderObjectValue(
    obj: HydratedContentSchema | HydratedFieldSchema,
    indent = 0,
  ): string {
    let tsCode = '{\n';

    for (const field of obj.fields!) {
      tsCode += ' '.repeat(indent + 2) + `${TypescriptRenderer.renderObjectKey(field.name)}`;

      if (!field.required) {
        tsCode += '?';
      }

      tsCode += ': ';

      if (field.type.name != 'group') {
        tsCode += field.type.castTo;
      } else {
        tsCode += TypescriptRenderer.renderObjectValue(field, indent + 2);
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

  private static generateStoreBarrel(storeMap: StoreMap): string {
    let tsCode = '';

    for (const docSlug of Object.keys(storeMap.documents)) {
      tsCode += `export * from "./${docSlug}";\n`;
    }

    return tsCode;
  }
}
