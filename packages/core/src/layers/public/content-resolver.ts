export interface ContentResolver {
  content(provider: string, resourcePath: string): Uint8Array | string | object | undefined;
}
