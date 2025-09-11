import { Outcome, success } from 'defectless';
import { Authorization, Credential, Role, SecurityError } from '../../kernel';
import { SecurityLayer } from './security.layer';

export class NoneSecurityLayer implements SecurityLayer<void> {
  public parseAuthorization(credential?: Credential): Outcome<Authorization<void>, SecurityError> {
    return success({
      type: 'custom',
      value: credential?.credential || '',
    });
  }

  public validate(_: Authorization<void>): Outcome<Role, SecurityError> {
    return success(Role.ADMIN);
  }
}
