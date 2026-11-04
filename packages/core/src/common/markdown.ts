export interface MarkdownCodeBlock {
  start: number;
  end: number;
  content: string;
}

export function findMarkdownCodeBlocks(markdown: string): MarkdownCodeBlock[] {
  const blocks: MarkdownCodeBlock[] = [];

  // Opening fence: up to 3 spaces, 3+ backticks or tildes.
  const opening = /^ {0,3}(`{3,}|~{3,})[^\r\n]*(?:\r?\n|$)/gm;

  let match: RegExpExecArray | null;

  while ((match = opening.exec(markdown)) !== null) {
    const start = match.index;
    const fence = match[1];
    const delimiter = fence[0];
    const minLength = fence.length;

    // Closing fence: same character, at least as long,
    // optional trailing whitespace.
    const closing = new RegExp(
      `^ {0,3}${delimiter === '`' ? '`' : '~'}{${minLength},}[ \\t]*(?:\\r?\\n|$)`,
      'gm',
    );

    closing.lastIndex = opening.lastIndex;

    const closingMatch = closing.exec(markdown);

    // Unclosed fences extend to EOF.
    const end = closingMatch ? closing.lastIndex : markdown.length;

    blocks.push({
      start,
      end,
      content: markdown.slice(start, end),
    });

    opening.lastIndex = end;
  }

  return blocks;
}
