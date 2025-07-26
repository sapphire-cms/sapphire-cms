[![npm](https://img.shields.io/npm/v/@sapphire-cms/core.svg)](http://npm.im/@sapphire-cms/core)

# Core

The environment-agnostic, lightweight, and embeddable engine of Sapphire CMS.

The **Core** is the heart of Sapphire CMS. It encapsulates the full complexity of content management while
remaining completely agnostic of its runtime environment. This design makes it highly portable and easy to e
mbed in any JavaScript-based platform.

Built to run wherever JavaScript runs - from traditional servers to serverless and edge environments -
the Core delegates all interaction with the outside world to pluggable **layers**,
provided by a rich ecosystem of official and community **modules**.

## Default Module

While most Sapphire CMS capabilities come from external modules, the Core ships with a built-in default module.
This built-in module provides a few out-of-the-box layers, including:

- `content`
- `admin`
- `render`

### Default Content Layer

The default content layer provides the essential **field types** and **validators** expected from any modern CMS.
It enables powerful and flexible content modeling out of the box.

#### Field Types

- `check` - A simple boolean field accepting yes/no values.
- `group` - A special field type that groups multiple fields together.
- `number` - A field that stores numeric values only.
- `reference` - A field used to reference other documents within the CMS.
- `rich-text` - Stores large chunks of formatted text, designed for core document content.
- `tag` - Allows attaching custom tags to documents.
- `text` - A field for labels or short unformatted text values.

For a complete guide to field types, check the [official documentation](https://sapphire-cms.io/docs/content-modeling/field-types).

#### Field Validators

- `between` - Ensures that a field’s numeric value falls within a specified range.
- `integer` - Ensures that the field value is an integer.
- `required` - Ensures the value for the field is provided.

Full details and usage examples can be found in the [field validators documentation](https://sapphire-cms.io/docs/content-modeling/field-validators).

### Default Admin Layer

The default admin layer is a no-op (no operation) implementation that performs no administrative functions
on the running CMS instance.

It is useful in scenarios where administration should be explicitly disabled - for example,
when running a **bundled** Sapphire CMS in serverless environment.

### Default Render Layer

The default render layer includes a single basic renderer named `json`, which outputs documents as raw JSON.

Usage example:

```yaml
# ./sapphire-cms-data/pipelines/docs-to-ts.yaml

name: docs-to-ts
source: docs
target: '@node'
render: 'json'
```
