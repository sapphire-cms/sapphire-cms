[![npm](https://img.shields.io/npm/v/@sapphire-cms/node.svg)](http://npm.im/@sapphire-cms/node)

# Node Module

This module provides the ability to run Sapphire CMS in a **Node.js** environment.
It also allows content to be persisted and delivered via the local filesystem.

## Install

```yaml
sapphire-cms package install node
```

or

```yaml
scms pkg i node
```

## Provided Layers

- `bootstrap`
- `persistence`
- `platform`
- `delivery`
- `media`

## Examples

### Platform / Bootstrap / Persistence / Media

```yaml
# ./sapphire-cms.config.yaml

config:
  modules:
    - module: node
      config:
        data-dir: ./sapphire-cms-data
        output-dir: ./src/app/generated/cms

layers:
  bootstrap: '@node'
  persistence: '@node'
  platform: '@node'
  media: '@node'
```

### Delivery

```yaml
# ./sapphire-cms-data/pipelines/docs-to-ts.yaml

name: docs-to-ts
source: docs
target: '@node'
render: '@codegen/typescript'
```

## Parameters

| Parameter   | Type    | Mandatory | Description                                                                                                                    |
| ----------- | ------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| root        | string  | no        | Absolute path to the root folder of the CMS project. Defaults to the directory of the script invocation.                       |
| config-file | string  | no        | Absolute or relative path (from the root) to the configuration file. Defaults to `./sapphire-cms.config.yaml`.                 |
| data-dir    | string  | no        | Absolute or relative path (from the root) to the folder where CMS stores its internal data. Defaults to `./sapphire-cms-data`. |
| output-dir  | string  | no        | Absolute or relative path (from the root) to the folder where CMS outputs rendered documents. Defaults to `./out`.             |
| port        | number  | no        | Port to run the server on. Defaults to 4747.                                                                                   |
| ssl         | boolean | no        | Enable SSL for the server. Defaults to false.                                                                                  |
