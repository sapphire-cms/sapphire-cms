export type CliOptions = { [key : string]: string | number | boolean };

export enum Cmd {

  /** Packages. */
  package_install = 'package:install',
  package_remove = 'package:remove',

  /** Schemas. */
  list_schemas = 'schema:list',

  /** Documents. */
  document_create = 'document:create',
  document_edit = 'document:edit',
  document_delete = 'document:delete',
}
