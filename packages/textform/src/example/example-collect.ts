import { promises as fs } from 'fs';
import * as process from 'node:process';
import * as path from 'path';
import { collect } from '../collect';
import { form } from './data';

const formtextFile = process.argv[2];
const text = await fs.readFile(path.resolve(formtextFile), 'utf-8');

const inputs = collect(form, text);
console.log(inputs);
