import { AbstractManagementLayer, Frameworks } from '@sapphire-cms/core';

export class RestManagementLayer extends AbstractManagementLayer {
  public readonly framework = Frameworks.TSED;

  public afterPortsBound(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
