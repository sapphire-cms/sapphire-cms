[![npm](https://img.shields.io/npm/v/@sapphire-cms/cli.svg)](http://npm.im/@sapphire-cms/cli)

# CLI

Command-line tool for CMS administration and content management.

## Install

```yaml
sapphire-cms package install cli
```

or

```yaml
scms pkg i cli
```

## Usage

```shell
sapphire-cms
```

or

```shell
scms
```

to display the list of all available commands.

## Provided Layers

- `admin`
- `management`

## Configuration Example

```yaml
config:
  modules:
    cli:
      editor: gedit
```

## Module Parameters

| Parameter | Type   | Mandatory | Description                                                                                           |
| --------- | ------ | --------- | ----------------------------------------------------------------------------------------------------- |
| editor    | string | no        | Text editor to use for editing documents. If not specified, the system's default editor will be used. |
