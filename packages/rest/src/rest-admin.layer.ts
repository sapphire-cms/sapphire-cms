import { AbstractAdminLayer, Framework, matchError, PublicInfo } from '@sapphire-cms/core';
import { Context, Delete, Get, Post, QueryParams } from '@tsed/common';
import { Controller } from '@tsed/di';
import { PlatformResponse } from '@tsed/platform-http';
import { Outcome, success } from 'defectless';
import { extractCredential } from './authorization-utils';

@Controller('/admin')
export class RestAdminLayer extends AbstractAdminLayer {
  private static INSTANCE: RestAdminLayer | undefined;

  public readonly framework = Framework.TSED;

  constructor() {
    if (RestAdminLayer.INSTANCE) {
      return RestAdminLayer.INSTANCE;
    }

    super();

    RestAdminLayer.INSTANCE = this;
  }

  public afterPortsBound(): Outcome<void, never> {
    return success();
  }

  @Get('/info')
  public publicInfo(@Context() ctx: Context): Promise<void> {
    const res: PlatformResponse = ctx.response;

    return this.publicInfoPort().match(
      (info: PublicInfo) => {
        res.status(200).body(info);
      },
      (err) => {
        res.status(409).body(String(err));
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }

  @Post('/packages')
  public installPackages(
    @QueryParams('p') packages: string[] = [],
    @Context() ctx: Context,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    return this.installPackagesPort(packages, credential).match(
      () => {
        res.status(204).body('done');
      },
      (err) => {
        matchError(err, {
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
          },
          _: (otherError) => {
            res.status(409).body(String(otherError));
          },
        });
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }

  @Delete('/packages')
  public removePackages(
    @QueryParams('p') packages: string[] = [],
    @Context() ctx: Context,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    return this.removePackagesPort(packages, credential).match(
      () => {
        res.status(204);
      },
      (err) => {
        matchError(err, {
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
          },
          _: (otherError) => {
            res.status(409).body(String(otherError));
          },
        });
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }

  @Post('/halt')
  public halt(@Context() ctx: Context): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    return this.haltPort(credential).match(
      () => {
        res.status(204);
      },
      (err) => {
        matchError(err, {
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
          },
          _: (otherError) => {
            res.status(500).body(String(otherError));
          },
        });
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }
}
