# Feature Research

**Domain:** Voice-guided wellness and sensory relaxation AI
**Researched:** 2026-02-21
**Confidence:** MEDIUM -- based on extensive competitor analysis (Calm, Headspace, Replika/Blush, RelaxFrens, Vital, Breethe, Insight Timer) plus emerging AI wellness trends; some features in the intimacy-wellness intersection are newer and have fewer public references

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Streaming voice output with natural pacing** | Core product value is auditory; robotic or choppy TTS destroys the experience immediately. Calm and Headspace set the bar with professional narration. AI TTS (ElevenLabs, etc.) now meets this bar. | HIGH | Latency under 1 second is critical. WebSocket streaming with chunk-at-punctuation pattern. Must sound warm, not robotic. This is the single highest-risk technical feature. |
| **Structured session flow with clear phases** | Users expect a guided arc: beginning, middle, end. Calm's Daily Calm, Headspace's courses, and every guided meditation follow this pattern. The 5-phase structure (Atmosphere, Breathing, Sensory, Relaxation, Resolution) maps well to established practice. | MEDIUM | Session state machine is the backbone. Each phase needs distinct TTS tone/pacing. Resolution phase prevents abrupt endings (a common complaint about shorter app sessions). |
| **Session length options** | Every competitor offers 3-30 minute sessions. Users want to fit sessions into their schedule. Calm and Headspace both make this a primary selection criterion. | LOW | Offer 5/10/15/20/30 min presets. LLM prompt can control pacing and depth per duration. |
| **Basic playback controls** | Pause, resume, end session. Users need to handle interruptions (doorbell, phone call). Every audio app has these. | LOW | Minimal UI during session -- large pause button, end session. Voice-first means the screen should be secondary. |
| **Age gate / adult verification** | Product involves intimacy and body awareness for adults. Regulatory pressure is intense (California SB 243, EU GDPR, Italy's 5M EUR fine against Replika's parent company). Missing this is a legal liability. | MEDIUM | Simple self-declaration age gate for v1. Biometric verification is overkill initially but may be needed later. Must be present before any intimate content. |
| **Consent gates before intimate content** | Both ethical requirement and legal necessity. Blush's AI characters can set boundaries; this product must do the same for users. Replika's regulatory troubles stemmed partly from insufficient consent mechanisms. | MEDIUM | Verbal consent check at session start. In-session check-ins before body awareness and sensory phases. User can decline or redirect at any point. |
| **Content safety boundaries** | Hard guardrails preventing explicit/graphic content. The product sits in a sensitive space -- wellness-adjacent intimacy without crossing into sexual content. Replika's forced content restriction pivot shows the consequences of getting this wrong. | HIGH | System prompt enforcement + output filtering. Keyword blocklist is insufficient alone -- need semantic-level guardrails. LLM must gracefully redirect rather than hard-block (jarring refusals break immersion). |
| **Privacy-first data handling** | 73% of users prioritize privacy in mental health apps (2025 Pew Survey). Sessions involve vulnerable emotional states. GDPR requires consent logging, data minimization, and right to deletion. | MEDIUM | No session recordings stored by default (already in PROJECT.md constraints). Minimal data collection. Clear privacy policy. Session metadata only, not transcripts. |
| **Responsive web interface** | Product is web-first. Users access from phones and desktops. Must work well on mobile browsers without native app. | MEDIUM | Mobile-optimized responsive design. Minimal visual UI during sessions (ambient background, phase indicator, controls). Pink wellness palette already defined. |
| **Background audio / ambient soundscapes** | Calm offers nature sounds, music. Headspace uses soundscapes. Insight Timer has 1000s of ambient tracks. Guided sessions without ambient audio feel bare and clinical. | MEDIUM | Layer ambient audio under TTS voice. Offer 3-5 soundscape options (rain, ocean, forest, ambient music, silence). Volume mixer for voice vs. background. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Real-time AI-generated sessions (not pre-recorded)** | Calm and Headspace use pre-recorded content. AI generation means infinite variety -- no two sessions are identical. Users never "run out" of content. RelaxFrens and Vital do this for meditation, but nobody does it well for intimacy/body awareness. | HIGH | This is THE core differentiator. LLM generates session content in real-time, streamed through TTS. Requires careful prompt engineering for consistency within the 5-phase structure. |
| **Conversational interactivity during sessions** | Most meditation apps are one-directional (listen only). This product can pause and respond to user input, creating a two-way experience. Headspace's Ebb AI companion does text-based conversation; this does it in voice during an active session. | HIGH | User can speak or type brief responses. AI adapts session flow based on input. Requires voice-to-text (STT) or simple text input. Start with text-based check-ins; voice input is a v2 feature. |
| **Adaptive session personalization over time** | AI learns preferences across sessions: preferred pacing, favorite themes, comfort levels. RelaxFrens reports 85% more session completions with AI personalization. Breethe's "Made4You" tool shows demand for this. | MEDIUM | Store preference profiles (not session content). Track: preferred session length, phase durations, themes liked/skipped, comfort level progression. Feed into system prompt per session. |
| **Emotional intimacy focus (unique content domain)** | No major player occupies the intersection of AI-guided voice + body awareness + emotional intimacy for wellness. Calm is meditation/sleep. Blush is text-based dating sim. This product owns the guided sensory-emotional voice experience niche. | MEDIUM | Content differentiation through system prompt and session structure. Not meditation (too passive), not therapy (too clinical), not dating sim (too gamified). A new category. |
| **Mood-based session selection** | User indicates current emotional state; AI tailors the session accordingly. "I'm anxious" gets calming breath work; "I'm feeling disconnected" gets body awareness focus. SacredSpace and RelaxFrens implement mood-to-session matching. | LOW | Pre-session mood check (3-5 emotion options). Map to session emphasis within the 5-phase structure. Simple but impactful personalization. |
| **Graceful boundary negotiation** | Unlike hard content blocks that break immersion, the AI navigates boundaries conversationally -- like Blush's characters that "set boundaries and end conversations" naturally. The AI redirects gently rather than refusing bluntly. | MEDIUM | Requires nuanced system prompt engineering. AI acknowledges the user's direction, validates it, and redirects to appropriate content. "I appreciate you sharing that. Let's bring that energy into something that feels good for both of us..." |
| **Session aftercare / resolution** | Dedicated wind-down phase that transitions users back to daily life. Many meditation apps end abruptly. The Resolution phase provides closure, grounding, and emotional reintegration. | LOW | Built into the 5-phase structure. Final phase includes grounding exercises, gentle return to awareness, and optional reflection prompt. Prevents emotional "drop" after intimate sessions. |
| **Progressive session series** | Multi-session journeys that build on each other (e.g., 7-day body awareness series, comfort expansion program). Headspace's courses and Calm's multi-day programs show this model works for retention. | MEDIUM | Requires session history tracking and series-aware system prompts. Defer to post-MVP but design the data model to support it from day one. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **User-uploaded voice clones** | Users want familiar/preferred voices | Massive safety and consent liability. Voice cloning of real people without consent is legally actionable in many jurisdictions. Deepfake concerns. | Offer 3-5 curated AI voice options with distinct personalities. Let users pick their preferred guide voice. |
| **Full two-way voice conversation** | Feels more natural and intimate than text input | Dramatically increases latency (STT + LLM + TTS pipeline). Speech recognition errors break immersion worse than text errors. Background noise issues. Mobile browser mic permissions are flaky. | Text-based check-ins during sessions for v1. Brief voice responses (yes/no) as v1.5. Full voice conversation as v2 stretch goal after latency optimization. |
| **Social features / community sharing** | Community drives engagement in apps like Insight Timer (showing active meditators) | Product involves intimate personal experiences. Sharing creates safety risks. Social pressure undermines the private, safe-space nature of the product. PROJECT.md explicitly scopes this out. | Solo experience only. Optional anonymous usage stats ("X people are relaxing right now") if social proof is desired -- no identity, no sharing. |
| **Gamification (streaks, badges, leaderboards)** | Headspace and Calm use streaks for retention | Gamification creates anxiety and obligation, undermining the relaxation purpose. "I broke my streak" guilt is antithetical to wellness. Turns intimate self-care into performance. | Gentle session history ("You've had 12 sessions this month"). No streaks, no badges, no competition. Positive reinforcement through the AI's conversational acknowledgment. |
| **Biometric integration (heart rate, HRV)** | Wearable data enables real-time session adaptation. Some apps use Apple Watch heart rate for meditation feedback. | Adds significant technical complexity. Requires device pairing, data processing pipeline, and health data compliance (HIPAA-adjacent). Delays MVP by months. | Build the personalization framework to accept biometric inputs later, but ship without hardware dependencies. Session adaptation based on user's self-reported state first. |
| **Explicit sexual content** | Adjacent market demand exists (AI companion apps monetize this heavily) | Legal, ethical, and platform risk. App store rejection. Payment processor restrictions. Regulatory scrutiny (Italy/EU precedent). PROJECT.md explicitly prohibits this. Content moderation costs explode. | Firm boundary at sensory awareness and emotional intimacy. The product is about feeling present in your body, not sexual gratification. This boundary IS the brand. |
| **Therapy / clinical claims** | Users may want therapeutic benefits quantified | Regulatory minefield. FDA digital therapeutics rules. Cannot claim to treat anxiety, depression, etc. without clinical validation. Calm Health went through significant compliance to offer clinical programs. | Position as wellness and relaxation, never as therapy or treatment. Include disclaimer. If users need clinical support, provide resources to real therapists. |
| **Multi-language support** | Expands addressable market | TTS quality varies dramatically by language. LLM output quality for intimate/nuanced content degrades in non-English languages. System prompt engineering per language is substantial. | English-first for v1 (already in PROJECT.md scope). Evaluate TTS quality in target languages before committing to expansion. |

## Feature Dependencies

```
[Streaming TTS Voice Output]
    |-- requires --> [LLM Response Generation]
    |-- requires --> [WebSocket Audio Streaming]
    |-- requires --> [Session State Machine]
    |
    v
[Structured 5-Phase Session Flow]
    |-- requires --> [Session State Machine]
    |-- requires --> [LLM System Prompt with Phase Instructions]
    |-- enhances --> [Session Aftercare / Resolution]
    |
    v
[Basic Playback Controls]
    |-- requires --> [Audio Player Component]
    |-- requires --> [Session State Machine]

[Age Gate]
    |-- required-before --> [Any Session Content]
    |-- required-before --> [Consent Gates]

[Consent Gates]
    |-- required-before --> [Body Awareness / Sensory Phases]
    |-- enhances --> [Graceful Boundary Negotiation]

[Content Safety Boundaries]
    |-- requires --> [LLM System Prompt Guardrails]
    |-- requires --> [Output Filtering Layer]
    |-- enhances --> [Graceful Boundary Negotiation]

[Mood-Based Session Selection]
    |-- requires --> [Session State Machine]
    |-- enhances --> [Adaptive Session Personalization]

[Adaptive Session Personalization]
    |-- requires --> [User Preference Storage]
    |-- requires --> [Session History Tracking]
    |-- enhances --> [Progressive Session Series]

[Background Audio / Soundscapes]
    |-- requires --> [Audio Mixer Component]
    |-- independent-of --> [LLM / TTS pipeline]

[Conversational Interactivity]
    |-- requires --> [Streaming TTS Voice Output]
    |-- requires --> [Session State Machine]
    |-- requires --> [Text Input UI or STT]
    |-- enhances --> [Adaptive Session Personalization]
```

### Dependency Notes

- **Streaming TTS is the foundation:** Nearly every feature depends on reliable, low-latency voice output. This must work before anything else matters.
- **Session State Machine is the backbone:** Phase progression, pause/resume, consent gates, and personalization all route through session state. Build this solidly in Phase 1.
- **Age Gate must precede all content:** Legal requirement. Should be the very first user interaction, before any session content is accessible.
- **Consent Gates require Age Gate:** Cannot ask for intimate content consent from unverified users.
- **Content Safety is parallel to TTS:** Safety boundaries operate at the LLM prompt level and output filtering level -- they should be developed alongside the core generation pipeline, not bolted on after.
- **Personalization requires history:** Adaptive features depend on stored preferences and session history. Design the data model early, but implement personalization features after core sessions work.
- **Background Audio is independent:** Soundscapes can be developed and tested independently of the LLM/TTS pipeline. Good candidate for parallel development.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what is needed to validate the concept.

- [ ] **Streaming TTS voice output** -- The product IS the voice. Without natural-sounding, low-latency streaming audio, there is no product.
- [ ] **5-phase session flow** -- The structured arc (Atmosphere > Breathing > Sensory > Relaxation > Resolution) is the core experience design. Validates whether the session structure resonates.
- [ ] **Session length selection** -- 10/15/20 minute options. Users need control over time commitment.
- [ ] **Basic playback controls** -- Pause, resume, end. Non-negotiable for any audio experience.
- [ ] **Age gate** -- Legal requirement. Simple date-of-birth or "I am 18+" confirmation.
- [ ] **Consent gate at session start** -- Brief verbal/text consent before body awareness content begins.
- [ ] **Content safety guardrails** -- System prompt enforcement + basic output filtering. Must ship with safety from day one.
- [ ] **Minimal responsive web UI** -- Pink wellness theme, session controls, phase indicator. Mobile-optimized.
- [ ] **Privacy-first architecture** -- No session recordings stored. Minimal data collection. Clear privacy notice.

### Add After Validation (v1.x)

Features to add once core sessions are validated with real users.

- [ ] **Background soundscapes** -- Add when users report the experience feels "bare" without ambient audio.
- [ ] **Mood-based session selection** -- Add when session variety is needed. Pre-session "How are you feeling?" that adapts the session emphasis.
- [ ] **Conversational interactivity (text)** -- Add when users request more agency during sessions. Text-based check-ins mid-session.
- [ ] **Session aftercare enhancements** -- Post-session reflection prompts, grounding exercises, journaling suggestion.
- [ ] **Multiple voice options** -- 2-3 curated AI voices with distinct warmth/tone profiles.
- [ ] **Graceful boundary negotiation** -- Upgrade from hard redirects to conversational boundary navigation.
- [ ] **User preference profiles** -- Remember preferred session length, voice, soundscape, comfort level.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Adaptive personalization over time** -- AI learns from session history to improve future sessions. Requires significant session data.
- [ ] **Progressive session series** -- Multi-session journeys (7-day programs). Requires content planning and series-aware prompts.
- [ ] **Voice input during sessions** -- STT for natural spoken responses. High complexity, latency-sensitive.
- [ ] **Wearable integration** -- Heart rate, HRV-based session adaptation. Only after core experience is solid.
- [ ] **Apple Watch / smart speaker support** -- Extend to non-screen devices. v2+ after web experience is mature.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Streaming TTS voice output | HIGH | HIGH | P1 |
| 5-phase session flow | HIGH | MEDIUM | P1 |
| Session length options | MEDIUM | LOW | P1 |
| Basic playback controls | HIGH | LOW | P1 |
| Age gate | HIGH (legal) | LOW | P1 |
| Consent gates | HIGH (legal/ethical) | MEDIUM | P1 |
| Content safety guardrails | HIGH (legal/brand) | HIGH | P1 |
| Privacy-first architecture | HIGH | MEDIUM | P1 |
| Responsive web UI | HIGH | MEDIUM | P1 |
| Background soundscapes | MEDIUM | LOW | P2 |
| Mood-based session selection | MEDIUM | LOW | P2 |
| Text-based interactivity | MEDIUM | MEDIUM | P2 |
| Multiple voice options | MEDIUM | LOW | P2 |
| Graceful boundary negotiation | MEDIUM | MEDIUM | P2 |
| User preference profiles | MEDIUM | MEDIUM | P2 |
| Session aftercare enhancements | LOW | LOW | P2 |
| Adaptive personalization | HIGH | HIGH | P3 |
| Progressive session series | MEDIUM | MEDIUM | P3 |
| Voice input (STT) | MEDIUM | HIGH | P3 |
| Wearable integration | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch -- product is broken without these
- P2: Should have -- add when core is validated (v1.x)
- P3: Nice to have -- future consideration after product-market fit (v2+)

## Competitor Feature Analysis

| Feature | Calm | Headspace | Replika/Blush | RelaxFrens | This Product |
|---------|------|-----------|---------------|------------|--------------|
| Voice delivery | Pre-recorded, professional narration, celebrity voices | Pre-recorded, themed voices | Text-only (Blush); text + limited voice (Replika) | AI-generated TTS | AI-generated real-time TTS -- infinite variety |
| Session structure | Daily Calm (10 min), courses, sleep stories | Structured courses with progression | Open-ended conversation | On-demand generated meditations | 5-phase structured arc with narrative progression |
| Personalization | Amazon Personalize recommendations | Time-of-day suggestions, focus area selection | Learns from conversation history | Mood-based session generation | Mood-based + preference learning + adaptive prompting |
| Interactivity | None (listen only) | None (listen only) | Full two-way text/voice chat | Prompt-based generation | Mid-session check-ins, consent gates, text responses |
| Content domain | Meditation, sleep, stress | Meditation, anxiety, sleep, focus | Emotional support, relationship skills | Meditation, breathwork, body scan | Body awareness, sensory relaxation, emotional intimacy |
| Safety features | Age-appropriate content ratings | Content ratings | Heavy moderation post-regulatory action | Standard content policies | Consent-first design, age gate, content guardrails, graceful boundary handling |
| Pricing model | $16.99/mo, $79.99/yr | $12.99/mo, $69.99/yr | Freemium + Pro subscription | Freemium | TBD -- subscription likely given per-session AI costs |
| Platform | iOS, Android, Web | iOS, Android, Web | iOS, Android, Web | Web, iOS | Web-first, mobile-optimized |

## Sources

- [Calm App Features](https://www.calm.com/) -- Official site, MEDIUM confidence
- [Calm App Review 2025](https://www.choosingtherapy.com/calm-app-review/) -- MEDIUM confidence
- [Headspace App Features](https://www.headspace.com/app) -- Official site, MEDIUM confidence
- [Best Meditation Apps Features Comparison 2025](https://www.themindfulnessapp.com/articles/best-meditation-apps-features-comparison-2025) -- MEDIUM confidence
- [Best AI Mental Health Apps 2026](https://www.myflourish.ai/post/top-ai-mental-health-apps-2026) -- LOW confidence (aggregator)
- [AI Meditation Apps 2026](https://mymeditatemate.com/blogs/wellness-tech/best-ai-mental-health-apps) -- LOW confidence (aggregator)
- [RelaxFrens AI Meditation](https://www.relaxfrens.com/wellness-app) -- MEDIUM confidence (official product site)
- [ElevenLabs Meditation Voices](https://elevenlabs.io/voice-library/meditation) -- HIGH confidence (official docs)
- [Blush AI Dating App](https://techcrunch.com/2023/06/07/blush-ai-dating-sim-replika-sexbot/) -- MEDIUM confidence (TechCrunch reporting)
- [6 Mindfulness App Design Trends 2026](https://www.bighuman.com/blog/trends-in-mindfulness-app-design) -- MEDIUM confidence
- [GDPR Compliance for Wellness Apps](https://secureprivacy.ai/blog/mental-health-app-data-privacy-hipaa-gdpr-compliance) -- MEDIUM confidence
- [AI Companion Apps 2026](https://www.psychologytoday.com/us/blog/becoming-technosexual/202602/everything-you-need-to-know-about-ai-companions-in-2026) -- MEDIUM confidence (Psychology Today)
- [Deepgram Real-Time TTS WebSockets](https://developers.deepgram.com/docs/tts-websocket-streaming) -- HIGH confidence (official docs)
- [ElevenLabs WebSocket Streaming](https://elevenlabs.io/docs/websockets) -- HIGH confidence (official docs)

---
*Feature research for: Voice-guided wellness and sensory relaxation AI*
*Researched: 2026-02-21*
