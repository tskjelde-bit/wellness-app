// src/lib/llm/sentence-chunker.ts
// Unchanged, as no safety here
export const ABBREVIATIONS = new Set([
  "mr",
  "mrs",
  "ms",
  "dr",
  "prof",
  "sr",
  "jr",
  "st",
  "ave",
  "blvd",
  "dept",
  "est",
  "govt",
  "i.e",
  "e.g",
  "vs",
  "etc",
  "approx",
  "min",
  "max",
  "no",
  "vol",
]);

export interface SplitResult {
  complete: string[];
  remainder: string;
}

export function splitAtSentenceBoundaries(
  text: string,
  minLength: number = 40,
): SplitResult {
  const complete: string[] = [];

  interface Boundary {
    sentenceEnd: number;
    nextStart: number;
  }

  const boundaries: Boundary[] = [];
  const sentenceEndRegex = /([.!?]+)(\s+|$)/g;
  let match: RegExpExecArray | null;

  while ((match = sentenceEndRegex.exec(text)) !== null) {
    const punctuation = match[1];
    const endOfPunctuation = match.index + punctuation.length;

    if (punctuation === ".") {
      const textUpToHere = text.slice(0, endOfPunctuation);
      const wordBefore = textUpToHere
        .trim()
        .split(/\s+/)
        .pop()
        ?.replace(/\.$/, "")
        .toLowerCase();

      if (wordBefore && ABBREVIATIONS.has(wordBefore)) {
        continue;
      }
    }

    boundaries.push({
      sentenceEnd: endOfPunctuation,
      nextStart: match.index + match[0].length,
    });
  }

  let lastCutIndex = 0;
  let pendingBoundaries: Boundary[] = [];

  for (const boundary of boundaries) {
    pendingBoundaries.push(boundary);
    const accumulatedText = text.slice(lastCutIndex, boundary.sentenceEnd).trim();

    if (accumulatedText.length >= minLength) {
      let segmentStart = lastCutIndex;

      for (const pending of pendingBoundaries) {
        const sentence = text.slice(segmentStart, pending.sentenceEnd).trim();
        if (sentence.length > 0) {
          complete.push(sentence);
        }
        segmentStart = pending.nextStart;
      }

      lastCutIndex = pendingBoundaries[pendingBoundaries.length - 1].nextStart;
      pendingBoundaries = [];
    }
  }

  const remainder = text.slice(lastCutIndex);

  return {
    complete,
    remainder: remainder.trimStart(),
  };
}
