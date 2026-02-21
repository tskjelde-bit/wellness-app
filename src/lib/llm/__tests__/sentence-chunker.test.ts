import { describe, it, expect } from "vitest";
import {
  splitAtSentenceBoundaries,
  ABBREVIATIONS,
  type SplitResult,
} from "../sentence-chunker";

describe("splitAtSentenceBoundaries", () => {
  describe("basic sentence splitting", () => {
    it("splits multiple complete sentences", () => {
      const result = splitAtSentenceBoundaries(
        "Hello world. How are you? I am fine.",
        10,
      );
      expect(result.complete).toEqual([
        "Hello world.",
        "How are you?",
        "I am fine.",
      ]);
      expect(result.remainder).toBe("");
    });

    it("returns incomplete text as remainder", () => {
      const result = splitAtSentenceBoundaries("Hello world. Ho", 10);
      expect(result.complete).toEqual(["Hello world."]);
      expect(result.remainder).toBe("Ho");
    });

    it("splits sentences ending with exclamation marks", () => {
      const result = splitAtSentenceBoundaries(
        "Breathe in slowly through your nose! Now exhale gently.",
        10,
      );
      expect(result.complete).toEqual([
        "Breathe in slowly through your nose!",
        "Now exhale gently.",
      ]);
      expect(result.remainder).toBe("");
    });

    it("handles multiple consecutive punctuation marks", () => {
      const result = splitAtSentenceBoundaries(
        "Wow!!! That was amazing.",
        10,
      );
      expect(result.complete).toEqual(["Wow!!!", "That was amazing."]);
      expect(result.remainder).toBe("");
    });
  });

  describe("empty and no-punctuation input", () => {
    it("handles empty string", () => {
      const result = splitAtSentenceBoundaries("");
      expect(result.complete).toEqual([]);
      expect(result.remainder).toBe("");
    });

    it("returns text without punctuation as remainder", () => {
      const result = splitAtSentenceBoundaries("No punctuation here");
      expect(result.complete).toEqual([]);
      expect(result.remainder).toBe("No punctuation here");
    });
  });

  describe("minimum length threshold", () => {
    it("holds short sentences in remainder when below minLength", () => {
      const result = splitAtSentenceBoundaries("Hi.", 40);
      expect(result.complete).toEqual([]);
      expect(result.remainder).toBe("Hi.");
    });

    it("holds multiple short sentences when combined below minLength", () => {
      const result = splitAtSentenceBoundaries(
        "Take a deep breath in. Feel the calm.",
        40,
      );
      expect(result.complete).toEqual([]);
      expect(result.remainder).toBe("Take a deep breath in. Feel the calm.");
    });

    it("uses default minLength of 40", () => {
      // "Hi." is 3 chars, well below default 40
      const result = splitAtSentenceBoundaries("Hi.");
      expect(result.complete).toEqual([]);
      expect(result.remainder).toBe("Hi.");
    });

    it("emits sentence when it meets minLength", () => {
      // "This is a sentence that meets the minimum length." is > 40 chars
      const result = splitAtSentenceBoundaries(
        "This is a sentence that meets the minimum length. Short.",
        40,
      );
      expect(result.complete).toEqual([
        "This is a sentence that meets the minimum length.",
      ]);
      expect(result.remainder).toBe("Short.");
    });
  });

  describe("abbreviation handling", () => {
    it("does not split on Dr.", () => {
      const result = splitAtSentenceBoundaries(
        "Dr. Smith will guide your breathing.",
        10,
      );
      expect(result.complete).toEqual([
        "Dr. Smith will guide your breathing.",
      ]);
      expect(result.remainder).toBe("");
    });

    it("does not split on Mrs.", () => {
      const result = splitAtSentenceBoundaries(
        "Mrs. Jones said hello. Let us begin.",
        10,
      );
      expect(result.complete).toEqual([
        "Mrs. Jones said hello.",
        "Let us begin.",
      ]);
      expect(result.remainder).toBe("");
    });

    it("does not split on e.g.", () => {
      const result = splitAtSentenceBoundaries(
        "e.g. this is an example. And more text.",
        10,
      );
      expect(result.complete).toEqual([
        "e.g. this is an example.",
        "And more text.",
      ]);
      expect(result.remainder).toBe("");
    });

    it("exports the ABBREVIATIONS set", () => {
      expect(ABBREVIATIONS).toBeInstanceOf(Set);
      expect(ABBREVIATIONS.has("dr")).toBe(true);
      expect(ABBREVIATIONS.has("mr")).toBe(true);
      expect(ABBREVIATIONS.has("mrs")).toBe(true);
      expect(ABBREVIATIONS.has("ms")).toBe(true);
      expect(ABBREVIATIONS.has("prof")).toBe(true);
      expect(ABBREVIATIONS.has("e.g")).toBe(true);
      expect(ABBREVIATIONS.has("i.e")).toBe(true);
      expect(ABBREVIATIONS.has("etc")).toBe(true);
      expect(ABBREVIATIONS.has("vs")).toBe(true);
    });
  });

  describe("return type", () => {
    it("returns a SplitResult with complete and remainder", () => {
      const result: SplitResult = splitAtSentenceBoundaries("Hello.", 5);
      expect(result).toHaveProperty("complete");
      expect(result).toHaveProperty("remainder");
      expect(Array.isArray(result.complete)).toBe(true);
      expect(typeof result.remainder).toBe("string");
    });
  });
});
