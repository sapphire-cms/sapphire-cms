import { Outcome, success } from 'defectless';
import { Framework } from '../../kernel';
import { AbstractPublicLayer } from './abstract-public.layer';

export class NonePublicLayer extends AbstractPublicLayer {
  public readonly framework = Framework.NONE;

  public afterPortsBound(): Outcome<void, never> {
    return success();
  }
}
