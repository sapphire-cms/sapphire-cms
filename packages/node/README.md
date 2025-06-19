[![npm](https://img.shields.io/npm/v/@sapphire-cms/node.svg)](http://npm.im/@sapphire-cms/node)

# Node Module

This module provides the ability to run Sapphire CMS in a **Node.js** environment.
It also allows content to be persisted and delivered via the local filesystem.

## Provided Layers

- `bootstrap`
- `persistence`
- `platform`
- `delivery`

## Parameters

| Parameter   | Type   | Mandatory | Description                                                                                                                    |
| ----------- | ------ | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| root        | string | no        | Absolute path to the root folder of the CMS project. Defaults to the directory of the script invocation.                       |
| config-file | string | no        | Absolute or relative path (from the root) to the configuration file. Defaults to `./sapphire-cms.config.yaml`.                 |
| data-dir    | string | no        | Absolute or relative path (from the root) to the folder where CMS stores its internal data. Defaults to `./sapphire-cms-data`. |
| output-dir  | string | no        | Absolute or relative path (from the root) to the folder where CMS outputs rendered documents. Defaults to `./out`.             |
