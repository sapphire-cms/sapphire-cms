[![npm](https://img.shields.io/npm/v/@sapphire-cms/codegen.svg)](http://npm.im/@sapphire-cms/codegen)

# Codegen Module

The Codegen module enables Sapphire CMS to transform content into code that can be directly integrated into your application.

## Install

```yaml
sapphire-cms package install codegen
```

or

```yaml
scms pkg i codegen
```

## Provided Layers

- `render`

### Render Layer

The render layer includes the following renderers:

- `typescript` - Transforms content into TypeScript code.
- `yaml` - Renders documents as YAML files.

### Typescript renderer

Transforms content into Typescript code.

Example:

```yaml
# pipelines/clients-to-ts.yaml

name: clients-to-ts
source: clients
target: '@node'
render: '@codegen/typescript'
```

In the example above, the pipeline transforms documents of type `clients` into TypeScript code
and stores the result on the local filesystem using the Node runtime.

### YAML renderer

Transforms content into YAML files.

Example:

```yaml
# pipelines/clients-to-yaml.yaml

name: clients-to-yaml
source: clients
target: '@node'
render: '@codegen/yaml'
```

In the example above, the pipeline transforms documents of type `clients` into YAML files
and stores them on the local filesystem using the Node runtime.
