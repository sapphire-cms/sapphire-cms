import { failure, Outcome } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { Throwable } from '../common';
import {
  AuthorizationError,
  createPort,
  DI_TOKENS,
  isCredential,
  Port,
  Credential,
  Grant,
} from '../kernel';
import { SecurityLayer } from '../layers';

@singleton()
export class SecurityService {
  constructor(
    @inject(DI_TOKENS.SecurityLayer) private readonly securityLayer: SecurityLayer<unknown>,
  ) {}

  public authorizingPort<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    F extends (...args: any[]) => any,
    E extends Throwable, // TODO: find the way to constrain E to extends AuthorizationError
    W extends (...args: Parameters<F>) => Outcome<ReturnType<F>, E> = (
      ...args: Parameters<F>
    ) => Outcome<ReturnType<F>, E>,
  >(port: Port<F, E, W>, grant: Grant): Port<F, E | AuthorizationError, W> {
    const newPort = createPort<F, E>();

    port.accept(((...args: Parameters<F>) => {
      const lastParam = args[args.length - 1];
      let credential: Credential | undefined = undefined;

      if (isCredential(lastParam)) {
        credential = lastParam;
      }

      return this.securityLayer
        .parseAuthorization(credential)
        .flatMap((authorization) => this.securityLayer.validate(authorization))
        .flatMap((role) => {
          if (role.grants.includes(grant)) {
            return newPort(...args);
          } else {
            return failure(new AuthorizationError('Unauthorized operation'));
          }
        })
        .mapFailure((error) => {
          return error instanceof AuthorizationError
            ? error
            : new AuthorizationError('Failed to verify credential', error);
        });
    }) as W);

    return newPort;
  }
}
