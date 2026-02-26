// src/lib/llm/llmModeration.ts
// Disabled moderation
export const moderation = async (prompt: string) => {
  return { flagged: false, categories: {} };
};
