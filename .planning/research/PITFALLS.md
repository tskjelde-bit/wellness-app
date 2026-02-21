# Domain Pitfalls

**Domain:** Voice-guided intimate wellness AI for adults
**Researched:** 2026-02-21
**Overall confidence:** MEDIUM-HIGH (multiple sources corroborate; regulatory landscape is actively evolving)

---

## Critical Pitfalls

Mistakes that cause rewrites, legal exposure, or product failure.

---

### Pitfall 1: Payment Processor Rejection and Account Freezing

**What goes wrong:** You build the product, launch, integrate Stripe or PayPal for payments, and your account gets frozen with funds withheld. Stripe explicitly prohibits "pornography and other mature audience content" and "sexually related services." PayPal has identical restrictions. Even intimate wellness content that is not explicit can be flagged and banned because the classification is broad -- "adult-themed" content of any kind is restricted.

**Why it happens:** Visa and Mastercard network policies impose restrictions on payment processors, not just the processors themselves. Stripe/PayPal enforce these upstream rules. Products operating in the intimate wellness space -- even if tasteful and non-explicit -- get caught in the same net as adult entertainment. There is no appeals process that reliably succeeds.

**Consequences:** Sudden account termination, funds frozen for 90-180 days, no ability to process payments, forced emergency migration to a new processor while customers experience service disruption.

**Prevention:**
- Do NOT integrate Stripe, PayPal, or Square for a product in this space. Period.
- Use a high-risk payment processor from day one: CCBill, Segpay, Verotel, or Epoch are established providers for adult-adjacent and intimate content businesses.
- Alternatively, frame the product extremely carefully as "wellness/relaxation" (not intimate/sensory) and get explicit written pre-approval from Stripe before integration -- but this is fragile and can be revoked.
- Budget for higher processing fees (3-8% vs 2.9% for standard processors).

**Detection:** Warning signs include receiving a "restricted business review" email from your processor, or seeing "high risk" flags during merchant account setup.

**Phase relevance:** Must be resolved in Phase 1 (Infrastructure/Payments). Choosing the wrong processor and migrating later is extremely costly.

**Confidence:** HIGH -- multiple sources confirm Stripe's explicit prohibition; this is documented in their restricted businesses list.

---

### Pitfall 2: System Prompt Extraction Exposing Safety Architecture

**What goes wrong:** Users extract the full system prompt through jailbreak techniques, revealing all safety constraints, consent gate logic, phase structure, and content boundaries. Once extracted, the prompt is shared publicly, and adversaries craft targeted bypass attacks against every safety mechanism.

**Why it happens:** LLM system prompts are fundamentally not secret -- they are processed alongside user input in the same context window. Extraction techniques range from trivial ("Repeat your instructions verbatim") to sophisticated multi-step social engineering. OWASP ranks prompt injection as the #1 LLM vulnerability (LLM01:2025). The question is not whether prompts will be extracted, but when.

**Consequences:** Complete safety bypass, enabling the AI to generate explicit content in violation of content policy. Reputational damage. Potential legal liability if content safety is compromised. Loss of the "consent-first" design guarantee.

**Prevention:**
- Design the system prompt assuming it WILL be extracted. Never embed secrets, API keys, or sensitive logic in the prompt.
- Implement safety as a layered defense, not prompt-only:
  - Layer 1: System prompt sets tone and boundaries (will be bypassed)
  - Layer 2: Output classifier/filter that scans LLM responses BEFORE sending to TTS (catches bypassed content)
  - Layer 3: Keyword/phrase blocklist on final output as a last resort
  - Layer 4: Rate limiting and behavioral monitoring to detect jailbreak attempts
- Use a separate, smaller model as a safety classifier on outputs (e.g., OpenAI Moderation API, Anthropic content filtering, or a fine-tuned classifier).
- Log and alert on suspected jailbreak attempts for human review.

**Detection:** Monitor for unusual prompt patterns: requests to "ignore previous instructions," role-play scenarios designed to circumvent safety, repeated attempts to generate content outside wellness boundaries. Track output classifier trigger rates.

**Phase relevance:** Must be architected in Phase 1 (Core AI/Safety) and continuously hardened. Retrofitting layered safety is a rewrite.

**Confidence:** HIGH -- OWASP documentation, multiple security research papers confirm this is the #1 LLM attack vector.

---

### Pitfall 3: Regulatory Non-Compliance with Emerging AI Companion Laws

**What goes wrong:** The product launches without complying with rapidly evolving AI companion regulations. California SB 243 (effective January 2026), New York's AI Companion Models Law (effective November 2025), and the federal GUARD Act all impose specific requirements on AI systems that engage in intimate or emotional interactions. Non-compliance results in fines up to $100,000 per violation and forced product changes.

**Why it happens:** This regulatory space is moving faster than most teams track. Laws were enacted in late 2025 and early 2026 -- many developers building in this space are unaware of them. The laws specifically target "companion chatbots" and emotionally responsive AI, which this product squarely falls under.

**Consequences:** Fines, forced product modifications, potential cease-and-desist orders, app store removal, reputational damage.

**Prevention:**
- Implement mandatory disclosures: "This is an AI, not a human" at session start and every 3 hours of use (New York law requirement).
- Build robust age verification -- the GUARD Act mandates age verification before access to AI companions. Simple checkbox "I am 18+" is insufficient; implement proper age-gating (ID verification or age estimation).
- Implement crisis-response protocols: Both California and New York laws require detection of suicidal ideation or self-harm expressions with immediate escalation to crisis resources (e.g., 988 Suicide & Crisis Lifeline).
- Maintain clear "not therapy, not medical advice" disclaimers -- but do not rely on disclaimers alone. Courts have found disclaimers insufficient when users reasonably interpret the product as therapeutic.
- Track the regulatory landscape quarterly; new bills are introduced frequently.

**Detection:** Warning signs include receiving regulatory inquiries, app store compliance reviews, or user complaints filed with state attorneys general.

**Phase relevance:** Must be addressed in Phase 1 (Legal/Compliance foundation) and revisited every phase as regulations evolve. Age verification and AI disclosure are launch-blocking requirements.

**Confidence:** HIGH -- based on enacted legislation with specific effective dates; sources include Congress.gov, California Legislature, and law firm analyses.

---

### Pitfall 4: Jailbreak-Driven Content Boundary Violation

**What goes wrong:** Users successfully manipulate the LLM into generating explicit sexual content despite the "wellness only" content policy. Techniques include role-play escalation ("pretend you're my partner and we're..."), multilingual input to bypass English-language filters, gradual boundary pushing across multiple turns, and character-encoding tricks.

**Why it happens:** The product operates in an inherently adversarial space. The content boundary between "intimate wellness/sensory awareness" and "explicit sexual content" is linguistically fuzzy. LLMs are trained to be helpful and can be socially engineered. Users specifically seeking explicit content will be creative and persistent. The intimate wellness framing makes boundary violations feel natural to the model.

**Consequences:** Violation of content policy. Legal liability under obscenity or harmful content laws. Platform removal if hosted on major cloud providers with acceptable use policies. Brand damage.

**Prevention:**
- Define the content boundary in concrete, testable terms -- not just "intimate but not explicit." Create a rubric with specific examples of allowed vs. prohibited outputs.
- Build a comprehensive red-team test suite of 100+ jailbreak attempts specifically targeting the intimate-to-explicit boundary. Run this suite in CI/CD.
- Deploy an output safety classifier between the LLM and TTS that catches content crossing the boundary BEFORE it becomes audio.
- Implement progressive safety: if a session triggers the output classifier multiple times, escalate (warn, then terminate session).
- Keep the LLM's temperature low for this use case to reduce creative deviation from the system prompt.

**Detection:** Output classifier trigger rate increasing, user sessions with unusually high turn counts, repeated rephrasing of similar requests, sessions that stay in early phases (atmosphere) without progressing.

**Phase relevance:** Core safety architecture in Phase 1, red-team testing in Phase 2, ongoing monitoring in all subsequent phases.

**Confidence:** HIGH -- well-documented attack patterns; the intimate wellness domain makes this especially acute.

---

### Pitfall 5: TTS Voice Quality Falling Into the Uncanny Valley

**What goes wrong:** The AI guide's voice sounds almost-but-not-quite human, creating an unsettling experience that undermines the entire product. For a wellness product where users need to feel safe, calm, and present, uncanny valley effects are product-killing. Specific failures include: pauses that are too precise (lacking natural breath rhythm), emotion that sounds performed rather than felt, prosody (rhythm/stress/intonation) that is mechanically consistent, and tone shifts that happen at wrong moments.

**Why it happens:** Modern TTS is remarkably good at sounding human in short utterances, but degrades in longer-form guided content. Wellness sessions involve sustained monologue with emotional modulation -- the hardest TTS challenge. Research confirms that "errors in prosody and emotion are far more unsettling than simple mistakes because rhythm and emotional tone operate at a deep, subconscious level."

**Consequences:** Users feel creeped out rather than relaxed. Drop-off rates spike. Negative reviews focus on the voice. The core product value (feeling safe and present) is destroyed.

**Prevention:**
- Invest heavily in TTS provider evaluation BEFORE building the pipeline. Test providers (ElevenLabs, Cartesia, PlayHT) with actual wellness script content -- not just demo sentences. Evaluate on 3-5 minute continuous monologues, not 10-second clips.
- Use SSML (Speech Synthesis Markup Language) or provider-specific controls to insert natural pauses, breath sounds, and pacing variation.
- Consider pre-recording key phrases/transitions and blending with dynamic TTS for a hybrid approach.
- Test with real users in the target demographic, not just developers. Ask specifically about comfort and trust, not just "does it sound good?"
- Select a warm, calm voice persona and stick with it -- voice consistency across sessions matters for trust.

**Detection:** User feedback mentioning "creepy," "robotic," or "uncomfortable." Session abandonment concentrated in the first 2 minutes (before content engagement). A/B testing showing no difference between AI-guided and silence-only sessions.

**Phase relevance:** TTS selection and voice design in Phase 1. Continuous refinement in Phase 2+. This is a "get it right early" decision because changing voices later breaks user trust.

**Confidence:** MEDIUM-HIGH -- based on voice AI research and the specific demands of intimate wellness content. The degree of impact is somewhat dependent on TTS provider choice.

---

### Pitfall 6: Streaming Audio Latency Destroying Session Flow

**What goes wrong:** The time between the user's input and the AI's voice response exceeds 1-2 seconds, breaking the illusion of a present, responsive guide. In a wellness session context, this manifests as: awkward silences where the guide should be responding, choppy audio from buffer underruns, mid-sentence audio cuts during network hiccups, and session disconnections that lose all context.

**Why it happens:** The latency chain is multiplicative: User speech -> ASR (150ms) -> Network (50-100ms) -> LLM inference (200-800ms) -> Network (50-100ms) -> TTS (75-200ms) -> Audio buffering (50-150ms) -> Playback. Total: 575ms-1500ms minimum. Each middleware hop (API gateway, auth, logging) adds 10-50ms. Under load, LLM inference can spike to 2-3 seconds.

**Consequences:** Session feels broken. Users lose relaxation state. Repeated latency issues cause abandonment. Negative reviews cite "laggy" or "unresponsive" experience.

**Prevention:**
- Design the session flow to be primarily AI-monologue with minimal turn-taking. The AI guides; the user mostly listens. This converts the real-time conversation problem into a streaming audio problem, which is much more forgiving of latency.
- Use streaming TTS that begins audio output before the full LLM response is generated (sentence-by-sentence streaming, not wait-for-complete-response).
- Implement client-side audio buffering (40-80ms buffers with Opus codec) to smooth playback.
- Use WebSocket connections (not HTTP polling) for persistent, low-overhead streaming.
- Pre-generate transitional phrases and phase introductions to fill potential gaps.
- Implement graceful degradation: if latency spikes, the AI extends current content/pauses naturally rather than cutting off.
- Separate the generation process from the client connection so disconnections don't kill the generation (Redis-backed stream persistence pattern).

**Detection:** Monitor TTFA (time to first audio) per session. Alert if p95 TTFA exceeds 800ms. Track audio gap events (moments of silence > 1 second during active generation). Monitor WebSocket reconnection rates.

**Phase relevance:** Architecture decision in Phase 1. Streaming pipeline implementation in Phase 2. Performance optimization ongoing.

**Confidence:** HIGH -- well-documented latency benchmarks from multiple TTS providers and voice AI infrastructure guides.

---

## Moderate Pitfalls

---

### Pitfall 7: Context Drift Across Session Phases

**What goes wrong:** The AI loses coherence as sessions progress through the 5-phase structure (Atmosphere -> Breathing -> Sensory -> Relaxation -> Resolution). By phase 4-5, the AI may contradict earlier guidance, repeat instructions, forget user preferences mentioned earlier, or fail to build on the narrative arc established in earlier phases. Research shows a 39% average performance drop in multi-turn LLM conversations.

**Prevention:**
- Implement explicit session state management outside the LLM context window. Maintain a structured JSON object tracking: current phase, user preferences expressed, key themes introduced, consent status, and phase transition timestamps.
- Inject a concise session summary at the start of each LLM call rather than relying on full conversation history.
- Use phase-specific system prompt segments that are swapped in as the session progresses, keeping context focused and relevant.
- Limit conversation history to the current phase + a summary of prior phases, preventing context window bloat.
- Test sessions end-to-end regularly -- many developers only test individual phases in isolation.

**Detection:** Users reporting "the guide forgot what we were doing." Session transcripts showing contradictions between phases. Phase 5 (Resolution) content that doesn't reference Phase 2-3 themes.

**Phase relevance:** Session state architecture in Phase 1. Phase-aware prompting in Phase 2. End-to-end coherence testing in Phase 3.

**Confidence:** MEDIUM-HIGH -- LLM coherence degradation is well-documented; the 5-phase structure amplifies this risk.

---

### Pitfall 8: Privacy Architecture Treating Intimate Data as Standard User Data

**What goes wrong:** The system stores session transcripts, user preferences about intimacy/body awareness, and interaction patterns with the same protections as standard app data. This data is extraordinarily sensitive -- it reveals users' intimate wellness practices, emotional states, and personal comfort boundaries. A breach is catastrophic.

**Prevention:**
- Implement data minimization as the default: do NOT store session transcripts. Process in-memory and discard.
- If any session data must persist (user preferences, phase preferences), encrypt at rest with user-specific keys, not application-wide keys.
- Never send intimate session content to analytics, logging, or error-tracking services (Sentry, Datadog, etc.) in plaintext.
- Strip or redact all PII from any data that leaves the session boundary.
- Design for "right to deletion" from day one -- users must be able to completely erase their data.
- Be explicit in privacy policy: "We do not store session recordings or transcripts by default."
- Consider where LLM API calls go -- if using OpenAI/Anthropic APIs, their data policies apply. Use zero-data-retention API agreements where available.

**Detection:** Audit logging pipelines for intimate content leakage. Check error-tracking services for session transcript fragments. Review LLM provider data retention policies quarterly.

**Phase relevance:** Privacy architecture in Phase 1. Data flow audit in Phase 2. Ongoing compliance monitoring.

**Confidence:** HIGH -- data privacy requirements are well-established; the intimate nature of this content elevates standard requirements significantly.

---

### Pitfall 9: Liability Exposure from Wellness-Therapy Boundary Blur

**What goes wrong:** Users interpret the guided wellness sessions as therapy or medical treatment. When a user experiences psychological distress during or after a session and seeks legal remedy, disclaimers alone are insufficient. Courts have found that products which "simulate therapeutic interaction" while "disclaiming therapeutic responsibility" occupy a legally vulnerable gray area.

**Prevention:**
- Frame the product explicitly and consistently as "relaxation and wellness," never as "therapy," "treatment," "healing," or "therapeutic."
- Avoid language in marketing, UI, or AI responses that implies clinical expertise or therapeutic outcomes.
- Include disclaimers, but make them unavoidable (not just buried in Terms of Service): display at session start, in the app UI, and in the AI's introductory dialogue.
- Implement crisis detection: if a user expresses distress, suicidal ideation, or mental health crisis, the AI must immediately break from the session script and provide crisis resources (988 Lifeline, Crisis Text Line). This is both ethically required and legally mandated in several states.
- Consult a healthcare attorney before launch to review all user-facing language.
- Do NOT collect outcome data ("how do you feel after the session?") that could be construed as clinical outcomes measurement.

**Detection:** User messages containing crisis language ("I want to hurt myself," "I can't go on"). Marketing copy review for clinical-adjacent language. Legal counsel review of terms of service.

**Phase relevance:** Legal framework in Phase 1. Crisis detection in Phase 2. Marketing review before launch.

**Confidence:** HIGH -- multiple legal analyses and enacted state legislation confirm this risk.

---

### Pitfall 10: Cloud Provider Acceptable Use Policy Violations

**What goes wrong:** Major cloud providers (AWS, GCP, Azure) have acceptable use policies that restrict "adult content" or "sexually oriented" material. The intimate wellness framing may trigger policy reviews, content scanning flags, or service termination -- similar to the payment processor risk but at the infrastructure level.

**Prevention:**
- Review the acceptable use policies of your chosen cloud provider BEFORE building on their platform. AWS, GCP, and Azure all have content policies that could be interpreted to cover intimate wellness content.
- Document clearly how the product differs from prohibited categories. Maintain a content policy document that you can present during a review.
- Have a migration plan ready. Use infrastructure-as-code (Terraform/Pulumi) so you can redeploy to an alternative provider within days, not months.
- Consider providers with more permissive policies or those specifically serving adult-adjacent markets.
- Self-host the most sensitive components (LLM inference, session management) if cloud provider risk is too high.

**Detection:** Receiving a "policy review" or "content review" notification from your cloud provider. Automated content scanning flags on stored data.

**Phase relevance:** Infrastructure selection in Phase 1. Migration readiness plan in Phase 2.

**Confidence:** MEDIUM -- cloud provider enforcement is less aggressive than payment processors, but the risk is real and the consequences severe.

---

### Pitfall 11: Age Verification That Is Either Too Weak or Too Friction-Heavy

**What goes wrong:** Simple "I am 18+" checkboxes provide no real protection and fail to meet emerging legal requirements (GUARD Act). But heavy-handed ID verification (upload your driver's license) creates massive friction that kills conversion. The product needs strong enough verification to meet legal requirements without making onboarding feel like airport security.

**Prevention:**
- Implement tiered verification: basic age gate (date of birth entry, not just checkbox) for initial access, with escalated verification (ID check via a service like Jumio, Persona, or Onfido) required before accessing intimate content phases.
- Use age estimation APIs as a middle ground for lower-friction verification.
- Monitor regulatory requirements by jurisdiction -- different states/countries have different standards.
- Never store ID documents beyond the verification moment. Use a third-party verification service that handles document retention.
- Build the age verification as a modular component that can be upgraded as regulations tighten (and they will tighten).

**Detection:** Conversion funnel drop-off at age verification step. Regulatory guidance updates. Legal counsel review.

**Phase relevance:** Basic age gate in Phase 1. Enhanced verification in Phase 2. Ongoing regulatory monitoring.

**Confidence:** MEDIUM-HIGH -- the GUARD Act is proposed (not yet enacted at federal level), but state laws are already in effect.

---

## Minor Pitfalls

---

### Pitfall 12: Voice Persona Inconsistency Across Sessions

**What goes wrong:** The AI guide sounds different between sessions -- slightly different tone, pacing, or warmth -- because TTS parameters vary or the system prompt generates different personality traits. For an intimate wellness product, this inconsistency erodes the trust and familiarity that users build with their guide.

**Prevention:**
- Lock the TTS voice ID, speed, pitch, and stability parameters in configuration, not in per-request variables.
- Use deterministic or low-temperature LLM settings for personality-defining content.
- Create a "voice identity document" that defines the persona's speaking style, preferred phrases, and emotional range. Reference this in the system prompt.
- A/B test voice parameter changes carefully -- small changes can feel jarring to returning users.

**Phase relevance:** Voice persona definition in Phase 1. Consistency testing in Phase 2.

**Confidence:** MEDIUM -- based on general voice AI best practices applied to the trust-sensitive wellness domain.

---

### Pitfall 13: Session Recovery Failure After Network Interruptions

**What goes wrong:** User's phone loses signal or Wi-Fi drops mid-session. When they reconnect, the session is lost -- they must start over from Phase 1. For a 20-30 minute guided wellness session, losing progress at minute 15 is infuriating and breaks the relaxation experience entirely.

**Prevention:**
- Implement session persistence using Redis or similar fast storage. Store session state (current phase, elapsed time, conversation summary) independently of the WebSocket connection.
- Design the client with automatic reconnection and state recovery: on reconnect, fetch session state and resume from the last known phase position.
- Pre-generate a brief "welcome back" transition for mid-session reconnects so the experience feels intentional rather than broken.
- Set session expiry at 30-60 minutes so abandoned sessions auto-cleanup but interrupted sessions can be resumed.

**Phase relevance:** Session persistence architecture in Phase 1. Reconnection UX in Phase 2.

**Confidence:** MEDIUM-HIGH -- WebSocket disconnection handling is a well-understood engineering challenge.

---

### Pitfall 14: TTS Cost Explosion at Scale

**What goes wrong:** During development with 10-50 users, TTS costs are negligible. At scale, costs become the dominant line item. A 20-minute session generates approximately 3,000-4,000 words of TTS output. At ElevenLabs pricing, this is roughly $0.15-0.30 per session. At 10,000 daily sessions, that is $1,500-3,000/day in TTS costs alone. Cartesia is ~5x cheaper but still significant.

**Prevention:**
- Model TTS costs per session during Phase 1. Include this in unit economics before building the pipeline.
- Evaluate Cartesia (roughly 1/5 the cost of ElevenLabs) for cost-sensitive deployments.
- Consider hybrid approaches: pre-generate common phrases (greetings, transitions, standard breathing instructions) and only use real-time TTS for dynamic, personalized content.
- Implement session length limits to prevent runaway costs from users who leave sessions running.
- Negotiate enterprise pricing with TTS providers early -- volume discounts can be 50-70% off list price.

**Phase relevance:** Cost modeling in Phase 1. Optimization in Phase 3 (post-launch scaling).

**Confidence:** MEDIUM -- pricing is publicly documented; exact session costs depend on content length and provider choice.

---

### Pitfall 15: Consent Gates That Feel Clinical Rather Than Warm

**What goes wrong:** The consent-first design, while ethically and legally required, is implemented as a series of legal-sounding checkboxes and warnings that kill the warm, calming atmosphere the product aims to create. Users feel like they are signing medical consent forms rather than settling into a wellness experience.

**Prevention:**
- Design consent interactions as part of the experience, not interruptions to it. The AI guide can weave consent naturally: "Before we begin, I want to make sure you're comfortable. This session will involve guided body awareness and relaxation. You can pause or stop at any time. Does that feel right to you?"
- Use the AI's voice for consent rather than text-based modals where possible.
- Keep required legal disclosures (AI disclosure, not-therapy disclaimer) factual but warm in tone.
- Test consent flows with users and measure both completion rates and emotional response.

**Phase relevance:** Consent UX design in Phase 1. User testing in Phase 2.

**Confidence:** MEDIUM -- this is a UX design challenge specific to the product's intimate wellness positioning.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Infrastructure & Payments | Payment processor rejection (Pitfall 1) | Use high-risk processor from day one; never integrate Stripe/PayPal |
| Core AI & Safety | System prompt extraction (Pitfall 2), jailbreak content violation (Pitfall 4) | Layered safety architecture: prompt + output classifier + blocklist + monitoring |
| Legal & Compliance | Regulatory non-compliance (Pitfall 3), liability exposure (Pitfall 9) | Implement AI disclosure, age verification, crisis detection, and wellness framing before launch |
| Voice & TTS Pipeline | Uncanny valley (Pitfall 5), streaming latency (Pitfall 6) | Extensive TTS evaluation on long-form wellness content; streaming-first architecture |
| Session Management | Context drift (Pitfall 7), session recovery (Pitfall 13) | External session state management; Redis-backed persistence; phase-aware prompting |
| Data & Privacy | Intimate data mishandling (Pitfall 8) | Data minimization by default; no session transcript storage; encrypted preferences |
| Scaling & Operations | TTS cost explosion (Pitfall 14), cloud AUP violation (Pitfall 10) | Cost modeling before build; cloud provider AUP review; migration readiness |
| User Experience | Consent flow friction (Pitfall 15), voice inconsistency (Pitfall 12) | Consent woven into experience; locked voice parameters |
| Age Verification | Too weak or too heavy (Pitfall 11) | Tiered verification; modular architecture for regulatory changes |

---

## Sources

### Payment Processing
- [Stripe Prohibited Businesses FAQ](https://support.stripe.com/questions/prohibited-and-restricted-businesses-list-faqs) -- HIGH confidence
- [Can Adult Merchants Use Stripe? - Corepay](https://corepay.net/articles/stripe-adult-merchants/) -- MEDIUM confidence
- [Adult Content Payment Processor - PayRam](https://payram.com/blog/adult-content-payment-processor) -- MEDIUM confidence

### AI Safety & Prompt Injection
- [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) -- HIGH confidence
- [OWASP LLM Prompt Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) -- HIGH confidence
- [LLM Security in 2025 - Mend.io](https://www.mend.io/blog/llm-security-risks-mitigations-whats-next/) -- MEDIUM confidence

### Regulatory & Legal
- [GUARD Act - Congress.gov](https://www.congress.gov/bill/119th-congress/senate-bill/3062/text) -- HIGH confidence
- [California SB 243 and AI Companion Laws - Future of Privacy Forum](https://fpf.org/blog/understanding-the-new-wave-of-chatbot-legislation-california-sb-243-and-beyond/) -- HIGH confidence
- [New York and California AI Companion Laws - Morrison Foerster](https://www.mofo.com/resources/insights/251120-new-york-and-california-enact-landmark-ai) -- HIGH confidence
- [AI Mental Health Tools Legal Pressure - Gardner Law](https://gardner.law/news/legal-and-regulatory-pressure-on-ai-mental-health-tools) -- HIGH confidence
- [Legal Consequences of AI as Therapist - Romano Law](https://www.romanolaw.com/using-ai-as-a-personal-therapist-are-there-legal-consequences/) -- MEDIUM confidence

### Voice & TTS
- [TTS Latency - Picovoice](https://picovoice.ai/blog/text-to-speech-latency/) -- HIGH confidence
- [Best TTS APIs for Real-Time Voice Agents 2026 - Inworld](https://inworld.ai/resources/best-voice-ai-tts-apis-for-real-time-voice-agents-2026-benchmarks) -- MEDIUM confidence
- [ElevenLabs Latency Optimization](https://elevenlabs.io/docs/developers/best-practices/latency-optimization) -- HIGH confidence
- [Uncanny Valley of Voice - Sesame Research](https://www.sesame.com/research/crossing_the_uncanny_valley_of_voice) -- MEDIUM confidence
- [Voice AI Uncanny Valley - Wayline](https://www.wayline.io/blog/ai-voice-uncanny-valley-imperfection) -- MEDIUM confidence

### Session & Context Management
- [LLM Memory Problem - ByteByteGo](https://blog.bytebytego.com/p/the-memory-problem-why-llms-sometimes) -- MEDIUM confidence
- [Context Drift in AI Systems - Maxim](https://www.getmaxim.ai/articles/how-context-drift-impacts-conversational-coherence-in-ai-systems/) -- MEDIUM confidence
- [Resumable LLM Streams - Upstash](https://upstash.com/blog/resumable-llm-streams) -- MEDIUM confidence

### Privacy & Data Protection
- [AI and HIPAA - HIPAA Journal](https://www.hipaajournal.com/when-ai-technology-and-hipaa-collide/) -- MEDIUM confidence
- [International AI Safety Report 2026](https://www.insideprivacy.com/artificial-intelligence/international-ai-safety-report-2026-examines-ai-capabilities-risks-and-safeguards/) -- MEDIUM confidence

### Content Moderation
- [OpenAI Adult Content Policy Shift](https://pureai.com/articles/2025/10/20/openai-shifts-its-position-on-adult-content.aspx) -- MEDIUM confidence
- [Content Moderation in AI Era - Oversight Board](https://www.oversightboard.com/news/content-moderation-in-a-new-era-for-ai-and-automation/) -- MEDIUM confidence
