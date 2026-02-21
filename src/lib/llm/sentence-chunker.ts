/**
 * Sentence boundary chunker for streaming text.
 *
 * Splits accumulated text at natural sentence boundaries (. ! ?)
 * with abbreviation handling and minimum length thresholds.
 * Designed for TTS prosody: prevents short fragments and
 * false splits on abbreviations like Dr., Mr., e.g., etc.
 */

/** Abbreviations that should NOT trigger sentence splits */
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

/** Result of splitting text at sentence boundaries */
export interface SplitResult {
  /** Sentences ready to emit (met minLength threshold) */
  complete: string[];
  /** Incomplete text still buffering */
  remainder: string;
}

/**
 * Split text at sentence boundaries, respecting abbreviations and minimum length.
 *
 * @param text - The accumulated text to split
 * @param minLength - Minimum character length for a sentence to be emitted (default: 40)
 * @returns SplitResult with complete sentences and remaining buffer text
 */
export function splitAtSentenceBoundaries(
  text: string,
  minLength: number = 40,
): SplitResult {
  const complete: string[] = [];

  // Step 1: Find all valid sentence boundary positions (excluding abbreviations)
  interface Boundary {
    /** Index in text where the sentence-ending punctuation ends */
    sentenceEnd: number;
    /** Index in text after any trailing whitespace (start of next sentence) */
    nextStart: number;
  }

  const boundaries: Boundary[] = [];
  const sentenceEndRegex = /([.!?]+)(\s+|$)/g;
  let match: RegExpExecArray | null;

  while ((match = sentenceEndRegex.exec(text)) !== null) {
    const punctuation = match[1];
    const endOfPunctuation = match.index + punctuation.length;

    // Check if this is an abbreviation (only for single periods)
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

  // Step 2: Use boundaries to split text, respecting minLength
  // The minLength check applies to the total accumulated text from the
  // last emitted cut point. Once that total exceeds minLength, we emit
  // all individual sentences at their boundaries.
  let lastCutIndex = 0;
  let pendingBoundaries: Boundary[] = [];

  for (const boundary of boundaries) {
    pendingBoundaries.push(boundary);
    const accumulatedText = text.slice(lastCutIndex, boundary.sentenceEnd).trim();

    if (accumulatedText.length >= minLength) {
      // Emit all pending sentences individually
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
