import { MediaAsset, MediaType, PortError } from '@sapphire-cms/core';
import { failure, Outcome, Program, program, success } from 'defectless';
// @ts-expect-error cannot be resolved by Typescript but can be solved by Node
// eslint-disable-next-line import/no-unresolved
import { fileTypeFromFile, FileTypeResult } from 'file-type';
import sharp, { Metadata } from 'sharp';
import { FileError, FsError } from './errors';
import { readBinaryFile } from './fs-utils';

export function getFileType(filename: string): Outcome<FileTypeResult, FileError> {
  return Outcome.fromSupplier(
    () => fileTypeFromFile(filename),
    (err) => new FileError(`Failed to detect mime type of file ${filename}`, err),
  ).flatMap((fileType: FileTypeResult | undefined) => {
    return fileType
      ? success(fileType)
      : failure(new FileError(`Failed to detect mime type of file ${filename}`));
  });
}

export function readImageMetadata(filename: string): Outcome<Metadata, FileError> {
  return Outcome.fromSupplier(
    () => sharp(filename).metadata(),
    (err) => new FileError(`Failed to read metadata from image file ${filename}`, err),
  );
}

export function readMedia(file: string): Outcome<MediaAsset, PortError | FsError | FileError> {
  return program(function* (): Program<MediaAsset, PortError | FsError | FileError> {
    const content: Uint8Array = yield readBinaryFile(file);

    const mediaProperties: MediaAsset['properties'] = {
      sizeInBytes: content.byteLength,
    };
    const metadata: Record<string, string> = {};

    const fileType: FileTypeResult = yield getFileType(file);
    let mediaType: MediaType;

    if (fileType.mime.startsWith('image/')) {
      mediaType = MediaType.IMAGE;
      const imageMetadata: Metadata = yield readImageMetadata(file);
      mediaProperties.width = imageMetadata.width;
      mediaProperties.height = imageMetadata.height;

      metadata.orientation = String(imageMetadata.orientation);
      metadata.autoOrientWidth = String(imageMetadata.autoOrient.width);
      metadata.autoOrientHeight = String(imageMetadata.autoOrient.height);
      metadata.space = imageMetadata.space;
      metadata.channels = String(imageMetadata.channels);
      metadata.depth = imageMetadata.depth;
      metadata.isProgressive = String(imageMetadata.isProgressive);
      metadata.isPalette = String(imageMetadata.isPalette);
      metadata.hasProfile = String(imageMetadata.hasProfile);
      metadata.hasAlpha = String(imageMetadata.hasAlpha);

      if (imageMetadata.density) {
        metadata.density = String(imageMetadata.density);
      }

      if (imageMetadata.chromaSubsampling) {
        metadata.chromaSubsampling = imageMetadata.chromaSubsampling;
      }

      if (imageMetadata.bitsPerSample) {
        metadata.bitsPerSample = String(imageMetadata.bitsPerSample);
      }

      if (imageMetadata.pages) {
        metadata.pages = String(imageMetadata.pages);
      }

      if (imageMetadata.pageHeight) {
        metadata.pageHeight = String(imageMetadata.pageHeight);
      }

      if (imageMetadata.loop) {
        metadata.loop = String(imageMetadata.loop);
      }

      if (imageMetadata.delay) {
        metadata.delay = String(imageMetadata.delay);
      }

      if (imageMetadata.pagePrimary) {
        metadata.pagePrimary = String(imageMetadata.pagePrimary);
      }

      if (imageMetadata.pagePrimary) {
        metadata.pagePrimary = String(imageMetadata.pagePrimary);
      }

      if (imageMetadata.xmpAsString) {
        metadata.xmpAsString = imageMetadata.xmpAsString;
      }

      if (imageMetadata.compression) {
        metadata.compression = String(imageMetadata.compression);
      }

      if (imageMetadata.subifds) {
        metadata.subifds = String(imageMetadata.subifds);
      }

      if (imageMetadata.resolutionUnit) {
        metadata.resolutionUnit = String(imageMetadata.resolutionUnit);
      }

      if (imageMetadata.formatMagick) {
        metadata.formatMagick = imageMetadata.formatMagick;
      }
    } else if (fileType.mime.startsWith('video/')) {
      mediaType = MediaType.VIDEO;
    } else {
      return failure(new FileError(`Impossible to determine media type for file ${file}`));
    }

    return {
      type: mediaType,
      slug: '',
      mimeType: fileType.mime,
      content,
      properties: mediaProperties,
      metadata,
    };
  });
}
