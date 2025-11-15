import { Credential } from '@sapphire-cms/core';
import { PlatformContext } from '@sapphire-cms/tsed';

const basicAuthPattern = /^Basic\s+([^\s]+)$/;
const bearerAuthPattern = /^Bearer\s+([^\s]+)$/;

export function extractCredential(ctx: PlatformContext): Credential | undefined {
  const authorizationHeader = ctx.request.getHeader('Authorization');

  let match;

  if (!authorizationHeader) {
    return undefined;
  } else if ((match = authorizationHeader.match(basicAuthPattern))) {
    const encoded = match[1];
    const credential = atob(encoded);
    return { credential };
  } else if ((match = authorizationHeader.match(bearerAuthPattern))) {
    const credential = match[1];
    return { credential };
  } else {
    return undefined;
  }
}
