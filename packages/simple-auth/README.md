[![npm](https://img.shields.io/npm/v/@sapphire-cms/simple-auth.svg)](http://npm.im/@sapphire-cms/simple-auth)

# Simple Authentication Module

Module providing the ability of simple authentication using configured username & password.

## Install

```yaml
sapphire-cms package install simple-auth
```

or

```yaml
scms pkg i simple-auth
```

## Provided Layers

- `security`

## Example

```yaml
# ./sapphire-cms.config.yaml

config:
  modules:
    - module: simple-auth
      config:
        username: ${env.SAPPHIRE_USERNAME}
        password: ${env.SAPPHIRE_PASSWORD}

layers:
  security: '@simple-auth'
```

## Parameters

| Parameter | Type   | Mandatory | Description            |
| --------- | ------ | --------- | ---------------------- |
| username  | string | yes       | Administrator username |
| password  | string | yes       | Administrator password |
