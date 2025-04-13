export type CliOptions = { [key : string]: string | number | boolean };

export enum Cmd {

  /** Packages. */
  package_install = 'package:install',
  package_remove = 'package:remove',

  /** Schemas. */
  list_schemas = 'schema:list',

  /** Documents. */
  document_list = 'document:list',
  document_print = 'document:print',
  document_create = 'document:create',
  document_edit = 'document:edit',
  document_ref_edit = 'document:ref-edit',
  document_delete = 'document:delete',
  document_render = 'document:render',
}
