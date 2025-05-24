import { Frameworks } from '../../kernel';
import { AbstractAdminLayer } from './abstract-admin.layer';

export class DefaultAdminLayer extends AbstractAdminLayer {
  public readonly framework = Frameworks.NONE;

  public afterPortsBound(): Promise<void> {
    // DO NOTHING
    return Promise.resolve();
  }
}
