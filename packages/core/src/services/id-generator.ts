import { customAlphabet } from 'nanoid';

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789-_';
const nanoid = customAlphabet(alphabet, 10);

export function generateId(collectionName: string) {
  return `${collectionName}-${nanoid()}`;
}
