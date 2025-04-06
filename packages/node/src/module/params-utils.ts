import {NodeModuleParams} from './node.module';
import {getInvocationDir} from '../utils';
import * as path from 'path';

export type WorkPaths = NodeModuleParams & {
  schemasDir: string;
  documentsDir: string;
};

export function resolveWorkPaths(params: NodeModuleParams): WorkPaths {
  const root = params.root || getInvocationDir();
  const configFile = path.resolve(root, params.configFile || './sapphire-cms.config.yaml');
  const dataDir = path.resolve(root, params.dataDir || './sapphire-cms-data');
  const schemasDir = path.join(dataDir, 'schemas');
  const documentsDir = path.join(dataDir, 'documents');

  return {
    root,
    configFile,
    dataDir,
    schemasDir,
    documentsDir,
  };
}
