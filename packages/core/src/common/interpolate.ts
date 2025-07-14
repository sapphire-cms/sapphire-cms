type ContextValue = string | number | boolean | Context;
export interface Context {
  [key: string]: ContextValue;
}

function wrapWithFallback(context: Context): Context {
  return new Proxy(context, {
    get(target, prop: string) {
      const value = target[prop];
      if (value === undefined) {
        return '';
      }

      if (typeof value === 'object' && value !== null) {
        return wrapWithFallback(value as Context);
      }

      return value;
    },
  });
}

export function interpolate(template: string, context: Context): string {
  const wrappedContext = wrapWithFallback(context);
  return new Function('context', `with (context) { return \`${template}\`; }`)(wrappedContext);
}
