// The Markdown parser is slow on one very long block: its time grows with the
// square of the block size. A 10 MB file with no blank lines takes minutes.
// Normal Markdown, with blank lines between blocks, opens 10 MB in under 100 ms.
// So the editor turns the parser off for a file with a very long block.
// The file then opens as plain text. See docs/engineering/frontend/architecture.md.

/** The longest run of lines with no blank line between them. */
export function longestBlockLines(text: string): number {
  let longest = 0;
  let run = 0;
  let i = 0;
  const n = text.length;
  while (i < n) {
    let end = text.indexOf("\n", i);
    if (end === -1) end = n;
    // A blank line has only spaces and tabs.
    let blank = true;
    for (let j = i; j < end; j++) {
      const c = text.charCodeAt(j);
      if (c !== 32 && c !== 9 && c !== 13) {
        blank = false;
        break;
      }
    }
    if (blank) run = 0;
    else if (++run > longest) longest = run;
    i = end + 1;
  }
  return longest;
}

/** Measured: 3,600 lines in one block take about 150 ms to parse. */
export const MAX_BLOCK_LINES = 5000;

/** True if it is safe to parse the text as Markdown. */
export function canParseMarkdown(text: string): boolean {
  return longestBlockLines(text) <= MAX_BLOCK_LINES;
}
