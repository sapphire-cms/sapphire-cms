import { AbstractAdminLayer, Frameworks } from '@sapphire-cms/core';
import { Context, Delete, Get, Post, QueryParams } from '@tsed/common';
import { Controller } from '@tsed/di';
import { PlatformResponse } from '@tsed/platform-http';

@Controller('/admin')
export class RestAdminLayer extends AbstractAdminLayer {
  private static INSTANCE: RestAdminLayer | undefined;

  public readonly framework = Frameworks.TSED;

  constructor() {
    if (RestAdminLayer.INSTANCE) {
      return RestAdminLayer.INSTANCE;
    }

    super();

    RestAdminLayer.INSTANCE = this;
  }

  public afterPortsBound(): Promise<void> {
    return Promise.resolve(undefined);
  }

  @Post('/packages')
  public installPackages(
    @QueryParams('p') packages: string[],
    @Context() ctx: Context,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;

    return this.installPackagesPort(packages).match(
      () => {
        res.status(200).body('done');
      },
      (err) => {
        res.status(409).body(String(err));
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }

  @Delete('/packages')
  public removePackages(
    @QueryParams('p') packages: string[],
    @Context() ctx: Context,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;

    return this.removePackagesPort(packages).match(
      () => {
        res.status(200);
      },
      (err) => {
        res.status(409).body(String(err));
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }

  @Get('/schemas')
  public getContentSchemas(@Context() ctx: Context): Promise<void> {
    const res: PlatformResponse = ctx.response;

    return this.getContentSchemasPort().match(
      (schemas) => {
        res.status(200).body(schemas);
      },
      (err) => {
        res.status(500).body(String(err));
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }

  @Post('/halt')
  public halt(@Context() ctx: Context): Promise<void> {
    const res: PlatformResponse = ctx.response;

    return this.haltPort().match(
      () => {
        res.status(200);
      },
      (err) => {
        res.status(500).body(String(err));
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }
}
