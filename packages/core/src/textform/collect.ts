import {TextForm, TextFormCollected, TextFormField} from './textform.types';

const anchorLine = '%%';
const blankLinePattern = /^\s*$/;
const splitterPattern = /^\s*={3}=*\s*$/;
const commentLinePattern = /^%/;
const looseNumberInputPattern = /^\s*(\d+)(?:[,.](\d+))?\s*$/;
const checkBoxInputPattern = /^\[(.+)?]$/;

/**
 * Collects field values from the text.
 */
export function collect(form: TextForm, submission: string): TextFormCollected {
  const lines = submission.split('\n');
  const anchors = findMatchingLines(lines, line => line === anchorLine);

  if (anchors.length !== form.fields.length) {
    throw new Error(`Number of fields mismatch. Expected: ${form.fields.length}, submitted: ${anchors.length}`);
  }

  const blocks = extractBlocks(lines, anchors).slice(1);
  const fieldInputs = blocks.map(extractRawInput);

  const collected: TextFormCollected = {};

  for (let i = 0; i < form.fields.length; i++) {
    const formField = form.fields[i];
    const fieldInput = fieldInputs[i];
    const splitters = findMatchingLines(fieldInput, line => !!line.match(splitterPattern));
    const valuesBlocks = extractBlocks(fieldInput, splitters).filter(block => block.length);

    collected[formField.name] = valuesBlocks.length
        ? valuesBlocks
            .map(extractRawInput)
            .map(rawInput => parseFieldValue(formField, rawInput))
        : [];
  }

  return collected;
}

function findMatchingLines(lines: string[], predicate: (line: string) => boolean) {
  return lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => predicate(line))
      .map(({ index }) => index);
}

function extractBlocks(lines: string[], delimiters: number[]): string[][] {
  if (!delimiters.length) {
    return [lines];
  }

  const blocks: string[][] = [];

  // Push the block coming before the first delimiter
  blocks.push(lines.slice(0, delimiters[0]));

  for (let i = 0; i < delimiters.length; i++) {
    const delimiter = delimiters[i];
    let block: string[];

    if (i < delimiters.length - 1) {
      const nextAnchor = delimiters[i + 1];
      block = lines.slice(delimiter + 1, nextAnchor);
    } else {
      // This is last anchor, read until the end of file
      block = lines.slice(delimiter + 1);
    }

    blocks.push(block);
  }

  return blocks;
}

function extractRawInput(block: string[]): string[] {
  if (!block.length) {
    return [];
  }

  let startOfInput = 0;

  // Skip comment block
  while (block[startOfInput].match(commentLinePattern)
      && startOfInput < block.length - 1) {
    startOfInput++;
  }

  // Skip blank lines before the input
  while (block[startOfInput].match(blankLinePattern)
      && startOfInput < block.length - 1) {
    startOfInput++;
  }

  let endOfInput = block.length - 1;

  // Skip blank lines after the input
  while (block[endOfInput].match(blankLinePattern) && endOfInput > 0) {
    endOfInput--;
  }

  if (startOfInput <= endOfInput) {
    return block.slice(startOfInput, endOfInput + 1);
  } else {
    // No input, field was left empty
    return [];
  }
}

function parseFieldValue(formField: TextFormField, rawInput: string[]): any {
  switch (formField.type) {
    case 'string':
      return parseString(rawInput);
    case 'number':
      return parseNumber(rawInput);
    case 'boolean':
      return parseBoolean(rawInput);
  }
}

function parseString(rawInput: string[]): string {
  return rawInput.join('\n');
}

function parseNumber(rawInput: string[]): number {
  const input = rawInput.join();
  let match;

  if ((match = input.match(looseNumberInputPattern))) {
    const intPart = match[1];
    const decimalPart = match[2];

    if (decimalPart) {
      return parseFloat(`${intPart}.${decimalPart}`);
    } else {
      return parseInt(intPart);
    }
  } else {
    throw new Error(`Cannot parse number from: "${input}"`);
  }
}

function parseBoolean(rawInput: string[]): boolean {
  const input = rawInput.join();

  let match;
  if ((match = input.replaceAll(/\s/g, '').match(checkBoxInputPattern))) {
    return !!match[1];
  } else {
    throw new Error(`Cannot parse boolean from: "${input}"`);
  }
}
