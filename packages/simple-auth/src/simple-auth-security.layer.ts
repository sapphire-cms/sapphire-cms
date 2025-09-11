import { Authorization, Credential, Role, SecurityError, SecurityLayer } from '@sapphire-cms/core';
import { failure, Outcome, success } from 'defectless';
import { SimpleAuthModuleParams } from './simple-auth.module';

type UsernamePassword = {
  username: string;
  password: string;
};

export class SimpleAuthSecurityLayer
  implements SecurityLayer<UsernamePassword, SimpleAuthModuleParams>
{
  constructor(private readonly params: SimpleAuthModuleParams) {}

  public parseAuthorization(
    credential?: Credential,
  ): Outcome<Authorization<UsernamePassword>, SecurityError> {
    if (!credential) {
      return failure(new SecurityError('Credential is missing'));
    }

    const [username, password] = credential.credential.split(':');

    return success({
      type: 'basic',
      value: credential.credential,
      metadata: {
        username,
        password,
      },
    });
  }

  public validate(authorization: Authorization<UsernamePassword>): Outcome<Role, SecurityError> {
    if (
      authorization.metadata!.username != this.params.username ||
      authorization.metadata!.password != this.params.password
    ) {
      return failure(new SecurityError('Wrong credentials'));
    }

    return success(Role.ADMIN);
  }
}
