import { AbstractAdminLayer } from './abstract-admin.layer';

export class DefaultAdminLayer extends AbstractAdminLayer {
  public afterPortsBound(): Promise<void> {
    // DO NOTHING
    return Promise.resolve();
  }
}
