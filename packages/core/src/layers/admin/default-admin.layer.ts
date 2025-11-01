import { Outcome, success } from 'defectless';
import { Framework } from '../../kernel';
import { AbstractAdminLayer } from './abstract-admin.layer';

export class DefaultAdminLayer extends AbstractAdminLayer {
  public readonly framework = Framework.NONE;

  public afterPortsBound(): Outcome<void, never> {
    // DO NOTHING
    return success();
  }
}
