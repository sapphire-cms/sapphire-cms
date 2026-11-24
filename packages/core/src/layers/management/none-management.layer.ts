import { Outcome, success } from 'defectless';
import { Framework } from '../../kernel';
import { AbstractManagementLayer } from './abstract-management.layer';

export class NoneManagementLayer extends AbstractManagementLayer {
  public readonly framework = Framework.NONE;

  public afterPortsBound(): Outcome<void, never> {
    // DO NOTHING
    return success();
  }
}
