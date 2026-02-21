---
phase: 02-safety-consent-framework
plan: 02
subsystem: safety
tags: [openai, moderation-api, content-safety, crisis-detection, keyword-filter, wellness]

# Dependency graph
requires:
  - phase: 01-project-scaffolding
    provides: "Next.js project, TypeScript config, env validation"
provides:
  - "checkContentSafety composed three-layer filter function"
  - "moderateContent OpenAI Moderation API wrapper with custom sexual threshold"
  - "checkKeywordBlocklist domain-specific word-boundary keyword filter"
  - "detectCrisisKeywords crisis language detector with helpline response"
  - "SAFETY_SYSTEM_PROMPT LLM system prompt safety instructions"
  - "SAFETY_FALLBACKS wellness-appropriate fallback responses"
  - "getRandomFallback function for blocked content replacement"
affects: [03-llm-text-generation, 04-tts-audio-streaming, 05-session-orchestration]

# Tech tracking
tech-stack:
  added: ["openai@6.22.0"]
  patterns: ["three-layer safety pipeline", "custom moderation threshold", "word-boundary regex blocklist", "immersion-preserving fallbacks"]

key-files:
  created:
    - src/lib/safety/index.ts
    - src/lib/safety/moderation.ts
    - src/lib/safety/keyword-blocklist.ts
    - src/lib/safety/crisis-detector.ts
    - src/lib/safety/constants.ts
    - src/lib/safety/system-prompt-safety.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Kept HELPLINE_RESOURCES in safety/constants.ts as fallback since consent module (Plan 01) is not yet committed; TODO added for future import unification"
  - "Used 'as unknown as Record' type assertion for OpenAI SDK Categories/CategoryScores types which lack index signatures"
  - "Sexual category threshold set at 0.8 to avoid false positives on body-awareness wellness language"

patterns-established:
  - "Safety module barrel export: import { checkContentSafety } from '@/lib/safety'"
  - "Three-layer filter: crisis first, then moderation API, then keyword blocklist"
  - "Output invariant: SafetyCheckResult.output is ALWAYS a non-empty string"
  - "Fallback responses maintain session immersion (never error messages)"

requirements-completed: [SAFE-04, SAFE-05, SAFE-06]

# Metrics
duration: 3min
completed: 2026-02-21
---

# Phase 2 Plan 2: Three-Layer Content Safety Pipeline Summary

**Three-layer content safety filter with OpenAI omni-moderation-latest (custom 0.8 sexual threshold), 44-term domain keyword blocklist, crisis detector with 988/SAMHSA helpline response, and 8 wellness-appropriate fallback responses**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-21T08:27:30Z
- **Completed:** 2026-02-21T08:30:48Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- OpenAI Moderation API wrapper using omni-moderation-latest with custom sexual category threshold (0.8) to prevent false positives on wellness content
- Domain-specific keyword blocklist with 44 terms across explicit sexual, violence, substance abuse, and clinical claims categories using word-boundary regex
- Crisis language detector with 12 self-harm phrases that generates compassionate helpline response (988 Lifeline, SAMHSA)
- Composed checkContentSafety function running crisis detection first (highest priority), then moderation API (Layer 2), then keyword blocklist (Layer 3)
- System prompt safety template ready for Phase 3 LLM integration covering allowed domains, prohibited content, redirect phrasing, crisis response, and AI identity
- 8 wellness-appropriate fallback responses that maintain session immersion when content is blocked

## Task Commits

Each task was committed atomically:

1. **Task 1: Create OpenAI Moderation API wrapper, keyword blocklist, and crisis detector** - `c82d1f9` (feat)
2. **Task 2: Compose three-layer safety filter and create system prompt safety template** - `008fd86` (feat)

## Files Created/Modified
- `src/lib/safety/constants.ts` - Fallback responses (8), keyword blocklist (44 terms), crisis keywords (12), helpline resources
- `src/lib/safety/moderation.ts` - OpenAI Moderation API wrapper with custom sexual threshold (0.8)
- `src/lib/safety/keyword-blocklist.ts` - Domain-specific keyword filter with word-boundary regex and escapeRegex helper
- `src/lib/safety/crisis-detector.ts` - Crisis language detection with helpline response generation
- `src/lib/safety/index.ts` - Composed three-layer safety filter (checkContentSafety) with barrel re-exports
- `src/lib/safety/system-prompt-safety.ts` - LLM system prompt safety instructions (Layer 1)
- `package.json` - Added openai@6.22.0 dependency
- `package-lock.json` - Lock file updated

## Decisions Made
- **HELPLINE_RESOURCES fallback:** Consent module from Plan 01 exists on disk but is not committed yet. Created a local copy in safety/constants.ts with TODO to unify imports once Plan 01 is committed. Both copies have identical data.
- **Type assertions for OpenAI SDK:** The openai SDK's `Categories` and `CategoryScores` types don't have index signatures, requiring `as unknown as Record<string, T>` casts for dynamic property access. This is a known SDK typing limitation.
- **Sexual category threshold at 0.8:** Research Pattern 2 (Pitfall 2) documented that wellness content (body awareness, touch, warmth, sensation) triggers the sexual category at low scores. The 0.8 threshold provides defense against actual explicit content while allowing legitimate wellness language.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type assertion for OpenAI SDK types**
- **Found during:** Task 1 (moderation.ts type checking)
- **Issue:** Direct `as Record<string, T>` casts failed because OpenAI SDK's `Categories` and `CategoryScores` types lack index signatures
- **Fix:** Changed to `as unknown as Record<string, T>` two-step assertion
- **Files modified:** src/lib/safety/moderation.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** c82d1f9 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minimal -- standard TypeScript type narrowing issue with third-party SDK types. No scope creep.

## Issues Encountered
None beyond the type assertion fix documented above.

## User Setup Required
None - the OpenAI Moderation API requires an OPENAI_API_KEY environment variable, but this is already needed for Phase 3 (LLM generation) and will be configured then. The safety module is a library that can be type-checked and built without the key.

## Next Phase Readiness
- Safety module is a standalone library with no UI dependencies, ready for Phase 3 integration
- Phase 3 will import `checkContentSafety` to filter every LLM-generated sentence
- Phase 3 will use `SAFETY_SYSTEM_PROMPT` as the system prompt prefix
- Phase 4 (TTS) can rely on `SafetyCheckResult.output` always containing a non-empty string
- OPENAI_API_KEY must be configured before runtime use (build/type-check works without it)

## Self-Check: PASSED

All 6 created files verified on disk. Both task commits (c82d1f9, 008fd86) verified in git log.

---
*Phase: 02-safety-consent-framework*
*Completed: 2026-02-21*
