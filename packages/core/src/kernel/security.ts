export enum AuthenticationMethod {
  NONE = 'none',
  USERNAME_PASSWORD = 'username_password',
}

/**
 * Raw token/credential presented by the client.
 */
export interface Credential {
  credential: string;
}

export function isCredential(value: unknown): value is Credential {
  return (
    typeof value === 'object' &&
    value !== null &&
    'credential' in value &&
    typeof (value as { credential?: unknown }).credential === 'string'
  );
}

/**
 * Authorization object parsed from credential.
 */
export interface Authorization<Metadata> {
  type: 'jwt' | 'opaque' | 'basic' | 'custom';
  value: string;
  metadata?: Metadata;
}

// TODO: add grants for pipelines and shapers
interface ResourceActions {
  documents: 'list' | 'read' | 'write' | 'delete' | 'publish';
  schemas: 'list' | 'read';
  cms: 'install_packages' | 'remove_packages' | 'halt';
}

type Resource = keyof ResourceActions;
type GrantFor<R extends Resource> = `${R}:${ResourceActions[R]}`;

export type Grant = {
  [R in Resource]: GrantFor<R>;
}[Resource];

export class Role {
  public static ADMIN = new Role('admin', [
    'documents:list',
    'documents:read',
    'documents:write',
    'documents:delete',
    'documents:publish',
    'schemas:list',
    'schemas:read',
    'cms:install_packages',
    'cms:remove_packages',
    'cms:halt',
  ]);
  public static EDITOR = new Role('editor', [
    'documents:list',
    'documents:read',
    'documents:write',
    'documents:delete',
    'documents:publish',
    'schemas:list',
    'schemas:read',
  ]);

  constructor(
    public readonly role: string,
    public readonly grants: Grant[],
  ) {}
}
