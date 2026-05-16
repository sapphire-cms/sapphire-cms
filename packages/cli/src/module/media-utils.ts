import { Outcome } from 'defectless';
import sharp, { Metadata } from 'sharp';
import { FileError } from '../common';

export function readImageMetadata(filename: string): Outcome<Metadata, FileError> {
  return Outcome.fromSupplier(
    () => sharp(filename).metadata(),
    (err) => new FileError(`Failed to read metadata from image file ${filename}`, err),
  );
}
