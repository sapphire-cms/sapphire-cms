<div align="center">
    <img src="./docs/logo.png" style="width: 200px;" />
    <p><code>MAKING TYPESCRIPT CODE SAFE, PREDICTABLE AND RELIABLE</code></p>
</div>

[![npm](https://img.shields.io/npm/v/defectless.svg)](http://npm.im/defectless)
![npm bundle size](https://img.shields.io/bundlephobia/min/defectless)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/defectless)

`defectless` is a library for writing safe and predictable programs in Typescript - without surprises,
silent failures, or hidden bugs.
It helps developers model both success and failure clearly, and catch everything that could go wrong.

`defectless` is perfect for complex applications with multiple points of failure that rely heavily on `Promises`.

It’s primarily about types and conventions: no runtime dependencies, only a tiny footprint (~6 KB), and in return you
get an unparalleled level of correctness and safety.

Written in pure, environment-agnostic TypeScript, `defectless` runs anywhere JavaScript does: Node, Browser, Deno, Bun,
serverless platforms, edge runtimes, even embedded devices.

# Why defectless?

- A simple concept: _a Promise with a typed error channel_.
- No complicated functional programming: just clear, explicit flows.
- Native to TypeScript/JavaScript: built for real-world TS apps, not a port of Rust or Haskell ideas.
- Seamless sync + async composition: no explicit conversions - perfect for the JavaScript world where both coexist.
- Bulletproof safety, without heavy runtime.
- Lightweight DX and simple learning curve.

# First Glimpse

A fragile and unpredictable function:

```typescript
// Method signature describes the success type
// but says nothing about potential failures
async function loadConfigFile(filename: string): Promise<ConfigSchema> {
  const content = await fs.readFile(filename, 'utf-8'); // may fail (filesystem error)
  const json = JSON.parse(content); // may fail (invalid JSON)
  return zodSchema.parse(json); // may fail (schema mismatch)
}
```

The same function, made safe with `defectless`:

```typescript
// Signature explicitly declares all possible failures
function loadConfigFile(
  filename: string,
): Outcome<ConfigSchema, FsError | JsonParsingError | ValidationError> {
  return readTextFile(filename).flatMap(parseJson).through(validateConfig);
}

// Each risky operation is wrapped in an Outcome,
// and possible errors are modeled explicitly.

function readTextFile(filename: string): Outcome<string, FsError> {
  return Outcome.fromSupplier(
    () => fs.readFile(filename, 'utf-8'),
    (err) => new FsError(`Failed to read file ${filename}`, err),
  );
}

const parseJson: (content: string) => Outcome<any, JsonParsingError> = Outcome.fromFunction(
  (c) => JSON.parse(c),
  (err) => new JsonParsingError('Failed to parse JSON content', err),
);

function validateConfig(json: any): Outcome<any, ValidationError> {
  const parseResult = zodSchema.safeParse(json);

  if (parseResult.success) {
    return success(json);
  } else {
    return failure(new ValidationError('Config validation failed', parseResult.error.issues));
  }
}
```

# Philosophy

`defectless` is a framework for correctness. It enables developers to write complex programs without overlooking a
single pitfall. It is designed for both **synchronous** and **asynchronous** code, and both types of flows can be
seamlessly composed.

To achieve this goal, `defectless` follows these principles:

### 1. Uncompromising syntax

That may look verbose and intimidating at first, but leaves no room for mistake.

### 2. No Shortcuts in Error Handling

`defectless` doen't allow to ignore, swallow or hide rising errors. Every posible outcome should be handled explicitly.

### 3. Unified Composition of Sync and Async Flows

`defectless` makes it easy to compose both synchronous and asynchronous logic in the same flow.

### 4. Async by Default

All flows in `defectless` are asynchronous, unless declared synchronous explicitly. The first asynchronous operation
in the flow automatically escalate the flow to asynchronous mode.

### 5. No Error Goes Unnoticed

Every error - whether anticipated or unexpected - is caught and channeled through the system.
No swallowed exceptions. No `try/catch` black holes.
`defectless` makes error surfaces visible and typed.

### 6. Defects Must Surface

`defectless` separates failures from bugs. Unanticipated or uncatchable failures are classified as defects -
and they will manifest at the terminal operation.

# Outcomes

`defectless` revolves around objects called **Outcomes**. An Outcome represents the result of code execution - either
a success or a failure. You can think of Outcomes as _"Promises with a typed error channel."_

```typescript
// API with Promise; only success values are typed
function readTextFile(filename: string): Promise<string>;

// API with Outcome; both success and failures are typed
function readTextFile(filename: string): Outcome<string, FsError>;
```

While `Outcome` is not a subclass of `PromiseLike` and cannot be directly used with `async/await`,
it offers very similar semantics.

There are two kinds of Outcomes in `defectless`: `AsyncOutcome` and `SyncOutcome`.
They compose seamlessly together, and most of the time no explicit conversion is needed.

Asynchronous flows are the default in `defectless`, because most real-world applications rely on asynchronous calls
to external systems - such as file system operations, service requests, or background workers.

`SyncOutcome` is a special case representing the result of purely synchronous execution.
It must be declared explicitly. If any asynchronous operation appears in a synchronous flow,
the entire flow automatically escalates to asynchronous mode.

Outcomes expose a rich set of functional methods for transforming values and errors, performing side effects,
recovering from failures, and finalizing flows.

And while functional programming is powerful, the real magic of `Promise`s often comes from `async/await`,
which lets developers write asynchronous code in a pseudo-linear style.
`defectless` provides a very similar mechanism: you can compose Outcomes in a pseudo-linear manner using
**generator functions**. This allows developers to write clear, procedural-looking code while still benefiting
from the robust failure handling provided by `defectless`.

In addition to anticipated and expected failures, `defectless` also catches every error thrown within the
flows it manages. These errors are classified as **defects** - in other words,
actual bugs in your software.
Defects are preserved and resurface at the end of the flow, when the `Outcome` is unwrapped.

## Introducing defectless into your code

`defectless` is a **progressive library**. This means you can migrate only the parts of your code that require
particular care, instead of rewriting everything at once.

That said, it’s usually best to transform flows into `defectless` flows **end to end**.
To achieve this, Outcomes should be **wrapped and unwrapped at the edges** of your application.

The _edges_ are the boundaries where your application interacts with external systems - for example:

- calls to the operating system or file system,
- database queries,
- usage of third-party libraries,
- handling of HTTP requests.

**Rule of thumb**: wrap every call to code you don’t control into an `Outcome`,
and unwrap only when you need to return results to an external consumer
(console output, database write, HTTP response, etc.).
Inside your application, work directly with `Outcome`s.

### Example

Wrapping a risky method like `fs.readFile` into an `Outcome`:

```typescript
// Wrap invocation of fs.readFile into an Outcome
export function readTextFile(filename: string): Outcome<string, FsError> {
  return Outcome.fromSupplier(
    () => fs.readFile(filename, 'utf-8'),
    (err) => new FsError(`Failed to read file ${filename}`, err),
  );
}
```

Unwrapping an `Outcome` only at the boundary, before writing to console:

```typescript
// listDocuments returns Outcome<Document[], SomeError>
// It needs to be unwrapped before printing to console
await listDocuments(store).match(
  (documents) => console.log(documents),
  (err) => console.error(err),
  (defect) => console.error(defect),
);
```

### General Advices

To get the most out of `defectless`, follow these simple rules:

- Wrap and unwrap `Outcome`s **only at the edges** of your application.
- **Wrap risky** system calls or throwing methods from libraries, so the entire data flow remains safe.
- Use `SyncOutcome` only when necessary to emphasize that an **operation is purely synchronous**.
  Otherwise, prefer the generic `Outcome`.
- **Never return** `null` or `undefined` from a method returning an `Outcome`. Instead, return `success()` with no value.
- **Never use** `throw` inside your code - model errors as failures instead.
- `Outcome`s represent **results, not inputs**. Don’t pass them as function parameters; return them from operations.
- Leverage defects for bug reporting - every defect represents **an actual bug** in your program.

## Getting Started

Let’s dive into `defectless`. The first step is to add it to your TypeScript project:

```shell
npm install defectless
```

Everything `defectless` provides can be imported directly from the module:

```typescript
import { Outcome } from 'defectless';
```

`Outcomes` are the core utility classes provided by `defectless`. They represent the foundation of the library.  
To make your code safe and predictable, you should create an `Outcome` as soon as your code performs its first risky
operation, and unwrap it only when you need to return the result to an external consumer.

### Creating Outcomes from literals

There are multiple ways to create `Outcome`s. The simplest is creation from literals:

```typescript
import { success, failure } from 'defectless';

// Create succeeded Outcomes
success(); // SyncOutcome<void, never> - success with no value
success(42); // SyncOutcome<number, never> - success with value 42
success({ id: 1, name: 'test' }); // SyncOutcome<{ id: number; name: string }, never>

// Create failed Outcomes
failure(); // SyncOutcome<never, void> - failure with no value
failure('Something went wrong'); // SyncOutcome<never, string> - failure with a string error
failure(new Error('Invalid input')); // SyncOutcome<never, Error> - failure with an Error
```

Outcomes created with `success` and `failure` are **explicitly synchronous**.
They can be used in synchronous flows without escalating the flow to asynchronous mode.

> [!WARNING]  
> `success` and `failure` are intended **only for wrapping literals**.
> They are not designed to wrap the return values of function calls or variables.  
> Why? Because if you wrap a function call directly, that call executes **outside the defectless flow**,
> and any errors it throws will escape uncaught.  
> To wrap function or method invocations safely, always use `Outcome.fromSupplier` or `Outcome.fromFunction`.

```typescript
// ❌ Don’t do this!
// defectless cannot catch errors thrown by riskyFunction
const value = riskyFunction();
const outcome = success(value);

// Or worse:
const outcome = success(riskyFunction());

// ✅ Do this instead
// so the risky invocation is secured inside the defectless flow
const outcome = Outcome.fromSupplier(() => riskyFunction());

// Or, for functions with parameters:
const outcome = Outcome.fromFunction((p) => otherRiskyFunction(p))(param);
```

### Creating Outcomes from suppliers or from functions

Wrapping existing throwing functions is the **main way** to create an `Outcome`.
While you’ll sometimes create them from literals, most of the time you’ll be wrapping calls to code outside your
direct control - such as system APIs or third-party libraries.

For this, use the static methods `Outcome.fromSupplier` and `Outcome.fromFunction`:

- Both methods accept a factory function that produces either a plain value or a `Promise`.
- Both take an optional **error handler**: a function that intercepts any thrown error or rejected `Promise`
  and converts it into a managed failure.
- Providing an error handler is **highly recommended** - otherwise, underlying failures will be treated as **defects**.

```typescript
import { Outcome } from 'defectless';

declare function riskyFunction(): Promise<number>;

// Using fromSupplier with an async function
const outcome1 = Outcome.fromSupplier(
  () => riskyFunction(),
  (err) => new ManagedError(err),
);
// => AsyncOutcome<number, ManagedError>

// Using fromFunction with a synchronous function
const outcome2 = Outcome.fromFunction(
  JSON.parse,
  (err) => new JsonParsingError('Failed to parse JSON', err),
)('{ "value": 42 }');
// => SyncOutcome<any, JsonParsingError>
```

### Transforming Outcomes

Once an `Outcome` has been created, most of your code will focus on **transforming and combining** them.  
`Outcome` exposes a wide range of convenient functional methods to work with both success and failure states.

> [!IMPORTANT]  
> Defected `Outcome`s cannot be transformed. Once an unanticipated error occurs in a defectless flow,
> all subsequent operations are skipped, and the defect resurfaces during the final unwrapping.

Here is the list of available transformation methods (each will be detailed in the following chapters):

- `map`
- `tap`
- `mapFailure`
- `tapFailure`
- `flatMap`
- `through`
- `recover`
- `finally`

#### map and tap

`map` and `tap` are the most basic operations on an `Outcome`.

- `map` transforms the success value.
- `tap` performs a side effect on the success value without changing it.

These operations run **only on successful Outcomes**.
If the Outcome is a failure or a defect, they are skipped and the flow continues unchanged.

```typescript
import { Outcome } from 'defectless';

declare const outcome: Outcome<string, unknown>; // Outcome containing string "42"

const mapped = outcome.map((value) => parseInt(value));
// mapped: Outcome<number, unknown> containing number 42

const tapped = outcome.tap((value) => console.log(`value is ${value}`));
// tapped: Outcome<string, unknown> containing string "42"
// logs: "value is 42"
```

`map` and `tap` never change the nature of the flow.
If the original Outcome is synchronous, the result will remain synchronous.

#### mapFailure and tapFailure

`mapFailure` and `tapFailure` are the counterparts of `map` and `tap`, but for the **error channel**.

- `mapFailure` transforms the failure value.
- `tapFailure` performs a side effect on the failure without changing it.

```typescript
import { Outcome } from 'defectless';

declare const outcome: Outcome<Product, number>; // Outcome containing failure 404

const mapped = outcome.mapFailure((code) => {
  switch (code) {
    case 404:
      return 'Resource not found';
    case 500:
      return 'Internal server error';
    default:
      return 'Unknown error';
  }
});
// mapped: Outcome<Product, string> containing failure "Resource not found"

const tapped = outcome.tapFailure((code) => {
  analytics.track('product_lookup_failed', {
    errorCode: code,
    message: MESSAGES[code],
  });
});
// tapped: Outcome<Product, number> still containing failure 404
// side effect: error is tracked
```

`mapFailure` and `tapFailure` never change the nature of the flow.
If the original Outcome is synchronous, the result will remain synchronous.

#### flatMap and through

`flatMap` and `through` are like `map` and `tap`, but they work with functions that return Outcomes.
These are the operators that **can change the nature of the flow**: if the function returns an `AsyncOutcome`,
the result will also be an `AsyncOutcome`.

- `flatMap` transforms the success value by applying a function that returns another `Outcome`.
- `through` sequences a side-effect that returns an `Outcome`, propagates its failures,
  and preserves the original success value when it succeeds.

```typescript
import { Outcome } from 'defectless';

declare function loadContent(filename: string): Outcome<string, FsError>;
declare function parseJson(content: string): Outcome<any, JsonParsingError>;
declare function validateJson(json: any): Outcome<void, ValidationError>;

const outcome = loadContent('file.json');
// => Outcome<string, FsError>  (file contents or FsError)

const parsed = outcome.flatMap((content) => parseJson(content));
// => Outcome<any, FsError | JsonParsingError>  (parsed JSON or error)

const validated = parsed.through((json) => validateJson(json));
// => Outcome<any, FsError | JsonParsingError | ValidationError>
//    On success: original parsed JSON (unchanged)
//    On failure: the error from validateJson (or earlier steps)
```

#### recover

#### finally

## Acknowledgment

`defectless` began as a fork and extensive rework of [neverthrow](https://github.com/supermacro/neverthrow).
Although none of the original `neverthrow` code remains, we are deeply grateful to
[@supermacro](https://github.com/supermacro) and [m-shaka](https://github.com/m-shaka)
for maintaining `neverthrow` over the years.
Without their contributions, `defectless` would not exist.

## Licence

This repository is licensed under the [MIT](LICENSE) license.
