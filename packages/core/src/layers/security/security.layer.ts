import { Outcome } from 'defectless';
import { AnyParams } from '../../common';
import {
  AuthenticationMethod,
  Authorization,
  Credential,
  Layer,
  Role,
  SecurityError,
} from '../../kernel';

export interface SecurityLayer<Metadata, Config extends AnyParams | undefined = undefined>
  extends Layer<Config> {
  authenticationMethod: AuthenticationMethod;
  parseAuthorization(credential?: Credential): Outcome<Authorization<Metadata>, SecurityError>;
  validate(authorization: Authorization<Metadata>): Outcome<Role, SecurityError>;
}
