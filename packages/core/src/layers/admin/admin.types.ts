import { AuthenticationMethod } from '../../kernel';

export type PublicInfo = {
  version: string;
  authentication: {
    method: AuthenticationMethod;
  };
};
