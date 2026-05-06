import {
  AbstractAdminLayer,
  Framework,
  matchError,
  PublicInfo,
  TaskState,
} from '@sapphire-cms/core';
import {
  Context,
  Controller,
  Delete,
  Get,
  PathParams,
  PlatformContext,
  PlatformResponse,
  Post,
  QueryParams,
} from '@sapphire-cms/tsed';
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
  public publicInfo(@Context() ctx: PlatformContext): Promise<void> {
    const res: PlatformResponse = ctx.response;

    return this.publicInfoPort().match(
      (info: PublicInfo) => {
        res.status(200).body(info);
      },
      (err) => {
        console.error(err);
        res.status(500).body(String(err));
      },
      (defect) => {
        console.error(defect);
        res.status(500).body(String(defect));
      },
    );
  }

  @Post('/packages')
  public installPackages(
    @QueryParams('p') packages: string[] = [],
    @Context() ctx: PlatformContext,
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
            console.error(otherError);
            res.status(500).body(String(otherError));
          },
        });
      },
      (defect) => {
        console.error(defect);
        res.status(500).body(String(defect));
      },
    );
  }

  @Delete('/packages')
  public removePackages(
    @QueryParams('p') packages: string[] = [],
    @Context() ctx: PlatformContext,
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
            console.error(otherError);
            res.status(500).body(String(otherError));
          },
        });
      },
      (defect) => {
        console.error(defect);
        res.status(500).body(String(defect));
      },
    );
  }

  @Post('/tasks/backup')
  public startBackup(@Context() ctx: PlatformContext): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    return this.startBackupPort(credential).match(
      (taskState: TaskState) => {
        res.status(201).body(taskState);
      },
      (err) => {
        matchError(err, {
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
          },
          _: (otherError) => {
            console.error(otherError);
            res.status(500).body(String(otherError));
          },
        });
      },
      (defect) => {
        console.error(defect);
        res.status(500).body(String(defect));
      },
    );
  }

  @Get('/tasks/backup/:taskId')
  public backupTaskStatus(
    @Context() ctx: PlatformContext,
    @PathParams('taskId') taskId: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    return this.backupStatusPort(taskId, credential).match(
      (taskState: TaskState) => {
        res.status(200).body(taskState);
      },
      (err) => {
        matchError(err, {
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
          },
          _: (otherError) => {
            console.error(otherError);
            res.status(500).body(String(otherError));
          },
        });
      },
      (defect) => {
        console.error(defect);
        res.status(500).body(String(defect));
      },
    );
  }

  @Post('/halt')
  public halt(@Context() ctx: PlatformContext): Promise<void> {
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
            console.error(otherError);
            res.status(500).body(String(otherError));
          },
        });
      },
      (defect) => {
        console.error(defect);
        res.status(500).body(String(defect));
      },
    );
  }
}
