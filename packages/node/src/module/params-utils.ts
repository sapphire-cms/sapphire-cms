import * as path from 'path';
import { getInvocationDir } from '../common';
import { NodeModuleParams } from './node.module';

export type WorkPaths = NodeModuleParams & {
  schemasDir: string;
  pipelinesDir: string;
  documentsDir: string;
  contentMapFile: string;
};

export function resolveWorkPaths(params: NodeModuleParams): WorkPaths {
  const root = params.root || getInvocationDir();
  const configFile = path.resolve(root, params.configFile || './sapphire-cms.config.yaml');
  const dataDir = path.resolve(root, params.dataDir || './sapphire-cms-data');
  const outputDir = path.resolve(root, params.outputDir || './out');
  const schemasDir = path.join(dataDir, 'schemas');
  const pipelinesDir = path.join(dataDir, 'pipelines');
  const documentsDir = path.join(dataDir, 'documents');
  const contentMapFile = path.join(dataDir, 'content-map.json');

  return {
    root,
    configFile,
    dataDir,
    outputDir,
    schemasDir,
    pipelinesDir,
    documentsDir,
    contentMapFile,
    port: params.port,
    ssl: params.ssl,
  };
}
