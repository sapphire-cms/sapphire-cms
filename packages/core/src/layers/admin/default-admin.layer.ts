import { Outcome, success } from 'defectless';
import { Frameworks } from '../../kernel';
import { AbstractAdminLayer } from './abstract-admin.layer';

export class DefaultAdminLayer extends AbstractAdminLayer {
  public readonly framework = Frameworks.NONE;

  public afterPortsBound(): Outcome<void, never> {
    // DO NOTHING
    return success();
  }
}
