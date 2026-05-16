import { failure, Outcome, success } from 'defectless';
// @ts-expect-error cannot be resolved by Typescript but can be solved by Node
// eslint-disable-next-line import/no-unresolved
import { fileTypeFromFile, FileTypeResult } from 'file-type';
import { FileError } from '../common';

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
