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
import { Project, VariableDeclarationKind, WriterFunction } from 'ts-morph';
import { capitalize, kebabToCamel } from '../utils';

type CodeTree = {
  [key: string]: string | CodeTree;
};

@SapphireRenderer({
  name: 'typescript',
  params: [] as const,
})
export class TypescriptRenderer implements IRenderer {
  public renderDocument(
    document: Document,
    _contentSchema: ContentSchema,
  ): Outcome<Artifact[], RenderError> {
    const project = new Project({
      useInMemoryFileSystem: true,
    });

    this.generateDocument(document, project);
    const sourceFile = project.getSourceFiles()[0];

    return success([
      {
        createdAt: document.createdAt,
        lastModifiedAt: document.lastModifiedAt,
        mime: 'application/typescript',
        isMain: true,
        slug: sourceFile.getFilePath().toString(),
        content: new TextEncoder().encode(sourceFile.getFullText()),
      },
    ]);
  }

  public renderStoreMap(
    storeMap: StoreMap,
    contentSchema: HydratedContentSchema,
  ): Outcome<Artifact[], RenderError> {
    const renderedTypes: Artifact[] = [];
    const now = new Date().toISOString();

    const project = new Project({
      useInMemoryFileSystem: true,
    });

    // Generate document type
    this.generateDocumentType(contentSchema, project);

    // Generate index.ts files
    for (const [slug, docMap] of Object.entries(storeMap.documents)) {
      this.generateDocumentBarrel(storeMap.store, slug, docMap, project);
    }

    // Generate barrel for the whole store
    this.generateStoreBarrel(storeMap, project);

    for (const sourceFile of project.getSourceFiles()) {
      renderedTypes.push({
        createdAt: now,
        lastModifiedAt: now,
        mime: 'application/typescript',
        isMain: false,
        slug: sourceFile.getFilePath().toString(),
        content: new TextEncoder().encode(sourceFile.getFullText()),
      });
    }

    return success(renderedTypes);
  }

  private generateDocument(document: Document, project: Project) {
    const slug = documentSlug(document);
    const id = kebabToCamel(document.id) + '_' + kebabToCamel(document.variant);
    const objectType = capitalize(kebabToCamel(document.store));
    const typePath =
      [...document.path, document.id].map(() => '..').join('/') + `/${document.store}`;

    const sourceFile = project.createSourceFile(slug);

    sourceFile.addImportDeclaration({
      namedImports: [objectType],
      moduleSpecifier: `${typePath}.types`,
    });

    sourceFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: id,
          type: objectType,
          initializer: (writer) => {
            writer.write(JSON.stringify(document.content));
          },
        },
      ],
    });
  }

  private generateDocumentType(contentSchema: HydratedContentSchema, project: Project) {
    const typeName = capitalize(kebabToCamel(contentSchema.name));

    const sourceFile = project.createSourceFile(
      `${contentSchema.name}/${contentSchema.name}.types`,
    );

    sourceFile.addTypeAlias({
      isExported: true,
      name: typeName,
      type: TypescriptRenderer.writeFields(contentSchema.fields),
    });
  }

  private generateDocumentBarrel(
    store: string,
    slug: string,
    docMap: DocumentMap,
    project: Project,
  ) {
    const sourceFile = project.createSourceFile(`${store}/${slug}/index`);

    sourceFile.addExportDeclarations(
      Object.entries(docMap.variants).map(([variant, variantMap]) => {
        const constName = kebabToCamel(docMap.docId) + '_' + kebabToCamel(variantMap.variant);

        return {
          moduleSpecifier: `./${variantMap.variant}`,
          namedExports: [
            {
              name: constName,
              alias: variant === 'default' ? 'default' : undefined,
            },
          ],
        };
      }),
    );
  }

  private generateStoreBarrel(storeMap: StoreMap, project: Project) {
    const sourceFile = project.createSourceFile(`${storeMap.store}/index`);

    sourceFile.addExportDeclarations(
      Object.keys(storeMap.documents).map((docSlug) => ({
        moduleSpecifier: `./${docSlug}`,
      })),
    );

    sourceFile.addImportDeclarations(
      Object.entries(storeMap.documents).map(([docSlug, docMap]) => {
        let defaultImport: string | undefined;
        const namedImports: string[] = [];

        for (const variant of Object.keys(docMap.variants)) {
          const constName = kebabToCamel(docMap.docId) + '_' + kebabToCamel(variant);

          if (variant) {
            defaultImport = constName;
          } else {
            namedImports.push(constName);
          }
        }

        return {
          defaultImport,
          namedImports,
          moduleSpecifier: `./${docSlug}`,
        };
      }),
    );

    const storeTree: CodeTree = {};
    for (const [docSlug, docMap] of Object.entries(storeMap.documents)) {
      const slug = docSlug.split('/');

      let doc = storeTree;
      for (let token of slug) {
        token = `"${token}"`;

        if (!(token in doc)) {
          doc[token] = {};
        }

        doc = doc[token] as CodeTree;
      }

      for (const variant of Object.keys(docMap.variants)) {
        doc[`"${variant}"`] = kebabToCamel(docMap.docId) + '_' + kebabToCamel(variant);
      }
    }

    sourceFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: kebabToCamel(storeMap.store),
          initializer: (writer) => {
            TypescriptRenderer.writeObject(storeTree)(writer);
            writer.write(' as const');
          },
        },
      ],
    });
  }

  private static writeObject(value: CodeTree): WriterFunction {
    return (writer) => {
      writer.write('{');

      const entries = Object.entries(value);

      if (entries.length > 0) {
        writer.newLine();

        writer.indent(() => {
          entries.forEach(([key, child], index) => {
            writer.write(`${key}: `);

            if (typeof child === 'string') {
              // Write as TS identifier, without quotes.
              writer.write(child);
            } else {
              TypescriptRenderer.writeObject(child)(writer);
            }

            writer.write(',');

            if (index < entries.length - 1) {
              writer.newLine();
            }
          });
        });

        writer.newLine();
      }

      writer.write('}');
    };
  }

  private static writeFields(fields: HydratedFieldSchema[]): WriterFunction {
    return (writer) => {
      writer.write('{');
      writer.newLine();

      writer.indent(() => {
        for (const field of fields) {
          writer.write(TypescriptRenderer.renderObjectKey(field.name));

          if (!field.required) {
            writer.write('?');
          }

          writer.write(': ');

          TypescriptRenderer.writeFieldType(field)(writer);

          writer.write(';');
          writer.newLine();
        }
      });

      writer.write('}');
    };
  }

  private static writeFieldType(field: HydratedFieldSchema): WriterFunction {
    return (writer) => {
      if (field.type.name === 'group') {
        TypescriptRenderer.writeFields(field.fields)(writer);
      } else {
        writer.write(field.type.castTo);
      }

      if (field.isList) {
        writer.write('[]');
      }
    };
  }

  private static renderObjectKey(key: string): string {
    return key.includes('-') ? `"${key}"` : key;
  }
}
