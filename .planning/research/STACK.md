# Technology Stack

**Project:** Wellness & Sensory Connection Assistant
**Researched:** 2026-02-21

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 16.1.6 | Full-stack framework (frontend + API routes) | The dominant React meta-framework. App Router with Route Handlers supports streaming responses natively (ReadableStream). Server Components reduce client bundle. Turbopack dev server is fast. One deployment target for both the pink wellness UI and the streaming audio API routes. | HIGH |
| React | 19.2.4 | UI library | Ships with Next.js 16. Server Components, Suspense boundaries for streaming UI, and concurrent features are all stable. | HIGH |
| TypeScript | 5.9.3 | Type safety | Non-negotiable for a project with complex session state, LLM response types, and audio stream handling. Catches integration bugs at compile time. | HIGH |
| Tailwind CSS | 4.2.0 | Styling | v4 is a ground-up Rust rewrite (Oxide engine) -- 5x faster full builds, 100x faster incremental. CSS-first config with `@theme` directive maps perfectly to the pink wellness palette (`--color-blush: #F8C8DC`, `--color-rose: #D63384`, `--color-charcoal: #2B2B2B`). No config file needed -- design tokens live in CSS. | HIGH |

### LLM / AI

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| OpenAI Responses API | current | LLM text generation for session guidance | The Responses API replaced Chat Completions as OpenAI's primary API in March 2025. Built-in state management with `previous_response_id` chains turns without manual context assembly. 3% better reasoning (SWE-bench) and 40-80% better cache hit rates than Chat Completions. Use `gpt-4o-mini` for production (cheap at $0.15/$0.60 per 1M tokens) and `gpt-4o` for complex wellness scenarios. | HIGH |
| `openai` npm SDK | 6.22.0 | Node.js client for OpenAI APIs | Official SDK with first-class streaming support, typed responses, and Responses API compatibility. Handles both LLM and TTS calls. | HIGH |

### Text-to-Speech (Critical Path)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Primary: ElevenLabs** | SDK 2.36.0 (`@elevenlabs/elevenlabs-js`) | Voice output for wellness sessions | Best voice quality in the industry: 81.97% pronunciation accuracy, 44.98% high naturalness rating (vs OpenAI's 22%). For a product where the entire UX is listening to a calm wellness voice, quality is the #1 priority. WebSocket streaming API enables real-time audio delivery. Multi-context WebSocket allows up to 5 concurrent streams per connection. ~$180 per 1M characters ($99/mo Pro plan = 500K chars). | HIGH |
| **Fallback: OpenAI gpt-4o-mini-tts** | via `openai` SDK | Lower-cost TTS fallback | MOS scores exceeding 4/5. Steerable via prompt engineering (tone, emotion, pacing). Token-based pricing at ~$0.015/min of audio -- significantly cheaper than ElevenLabs. Good enough for non-premium tiers or as a cost-saving fallback. Supports streaming. | MEDIUM |

**Decision rationale -- ElevenLabs over alternatives:**

| Considered | Why Not Primary |
|------------|-----------------|
| Cartesia Sonic 3 | Best latency (40-90ms TTFA) but voice naturalness trails ElevenLabs. Better for conversational agents with rapid turn-taking. Our use case is one-way guided sessions where quality matters more than sub-100ms latency. |
| OpenAI TTS (tts-1-hd) | Lower naturalness scores (78% of instances rated "low naturalness"). Fine for notifications, not for a product built around voice immersion. |
| Deepgram Aura | Optimized for conversational AI latency (<250ms). Less natural-sounding than ElevenLabs for longer guided content. |
| Google Cloud TTS | Enterprise pricing, more complex integration, 380+ voices but less character than ElevenLabs voices. |

### Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Neon (Serverless PostgreSQL) | serverless driver 1.0.2 (`@neondatabase/serverless`) | Persistent storage (users, session history, preferences, consent records) | Native Vercel integration (powers Vercel Postgres). Serverless driver works over HTTP -- no connection pooling headaches in serverless functions. Auto-scaling scales to zero when idle (cost-efficient for early stage). Database branching creates preview DBs per PR. Post-Databricks acquisition: 15-25% price drops, free tier doubled to 100 CU-hours/month. | HIGH |
| Drizzle ORM | 0.45.1 | Database access layer | TypeScript-first ORM with zero abstraction overhead. SQL-like syntax (not a query builder pretending to be an ORM). Excellent Neon/PostgreSQL support. Schema-as-code with migration generation. Lightweight -- no heavy runtime like Prisma's query engine. | HIGH |
| Upstash Redis | latest (`@upstash/redis`) | Session state, real-time session data, rate limiting | HTTP-based Redis for serverless. No connection management. Pay-per-request pricing. Built-in TTL for session expiry. Perfect for ephemeral session state (current phase, user preferences mid-session) that doesn't need PostgreSQL durability. Global replication for low-latency reads. | HIGH |

### Authentication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Auth.js (NextAuth v5) | 5.0.0-beta.30 | User authentication, consent verification | The standard for Next.js auth. v5 works natively with App Router via universal `auth()` function. Supports OAuth providers, credentials, and magic links. Adults-only consent gates can be implemented as middleware checks. Beta but stable enough for production -- the Next.js ecosystem has standardized on it. | MEDIUM |

### Infrastructure

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| Vercel | Hosting & deployment | Native Next.js platform. Edge Functions for low-latency API routes. Automatic preview deployments. Streaming response support out of the box. Neon integration is first-party. | HIGH |
| Vercel AI SDK | LLM streaming helpers | `ai` package provides `streamText()`, `useChat()` hooks, and streaming UI primitives that work with OpenAI out of the box. Handles the SSE/streaming plumbing so you don't write it manually. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| Zod | 4.3.6 | Schema validation | Validate all API inputs, session state shapes, LLM response parsing. Use everywhere -- API routes, form data, environment variables. | HIGH |
| `@upstash/ratelimit` | latest | Rate limiting | Protect API endpoints from abuse. Critical for TTS endpoints (each call costs money). Serverless-compatible. | MEDIUM |
| Framer Motion | latest | Animations | Smooth transitions between session phases. Breathing exercise visualizations. Pink pulse animations. | MEDIUM |
| `lucide-react` | latest | Icons | Clean, consistent icon set. Tree-shakeable. Works well with Tailwind. | LOW |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 16 | Remix / SvelteKit | Next.js has the best streaming support, largest ecosystem, and native Vercel deployment. Remix is good but smaller ecosystem for AI/voice tooling. SvelteKit lacks the React AI ecosystem (Vercel AI SDK, etc.). |
| Backend | Next.js Route Handlers | Separate Fastify/Hono API | Adding a separate backend doubles deployment complexity for a v1. Next.js Route Handlers support streaming natively. If latency becomes an issue at scale, extract to a dedicated Fastify service later. |
| TTS | ElevenLabs | OpenAI TTS / Cartesia | Voice quality is the product. ElevenLabs wins on naturalness. Cartesia wins on latency but this isn't a two-way conversation app -- it's guided listening. OpenAI TTS is cheaper but noticeably less natural. |
| Database | Neon | Supabase | Supabase is a BaaS with more features (auth, realtime, storage) but we're using Auth.js and Upstash already. Neon is a better pure database: native Vercel integration, better serverless driver, instant branching. |
| ORM | Drizzle | Prisma | Prisma's query engine binary adds cold start latency in serverless. Drizzle is lighter, faster, and more SQL-like. Prisma has a larger ecosystem but Drizzle has caught up for PostgreSQL workloads. |
| State | Upstash Redis | PostgreSQL only | Session state is ephemeral (phase, preferences mid-session). Redis with TTL is purpose-built for this. PostgreSQL would work but adds unnecessary write load for data that expires in 30-60 minutes. |
| Auth | Auth.js v5 | Clerk / Supabase Auth | Auth.js is free and self-hosted. Clerk is excellent but adds cost and vendor lock-in for a feature (auth) that doesn't differentiate this product. Keep it simple. |
| Styling | Tailwind v4 | CSS Modules / styled-components | Tailwind v4's CSS-first config with `@theme` is ideal for the fixed pink palette. Utility-first approach enables rapid prototyping. No runtime cost (unlike styled-components). |

## Version Matrix (Verified 2026-02-21)

All versions verified via `npm view [package] version`:

```
next@16.1.6
react@19.2.4
typescript@5.9.3
tailwindcss@4.2.0
openai@6.22.0
@elevenlabs/elevenlabs-js@2.36.0
drizzle-orm@0.45.1
@neondatabase/serverless@1.0.2
zod@4.3.6
next-auth@5.0.0-beta.30
ioredis@5.9.3  (for local dev; Upstash for production)
```

## Installation

```bash
# Core framework
npm install next@16.1.6 react@19.2.4 react-dom@19.2.4

# AI & Voice
npm install openai@6.22.0 @elevenlabs/elevenlabs-js@2.36.0 ai

# Database
npm install drizzle-orm@0.45.1 @neondatabase/serverless@1.0.2
npm install @upstash/redis @upstash/ratelimit

# Auth
npm install next-auth@beta

# Validation
npm install zod@4.3.6

# UI
npm install framer-motion lucide-react

# Dev dependencies
npm install -D typescript@5.9.3 tailwindcss@4.2.0 drizzle-kit @types/react @types/node
```

## Cost Estimates (Monthly, Early Stage)

| Service | Free Tier | Estimated at 1K users | Notes |
|---------|-----------|----------------------|-------|
| Vercel | Hobby free | ~$20/mo Pro | Streaming routes may hit function duration limits on free tier |
| Neon | 100 CU-hrs free | ~$19/mo Launch | Scales to zero; branching included |
| Upstash Redis | 10K commands/day free | ~$10/mo Pay-as-you-go | Session state is lightweight |
| OpenAI (LLM) | Pay-per-use | ~$50-150/mo | gpt-4o-mini at $0.15/$0.60 per 1M tokens; depends on session length |
| ElevenLabs | Free tier (10K chars) | ~$99/mo Pro (500K chars) | The biggest line item. ~5-10 min of audio per session, each session ~2-3K chars |
| Auth.js | Free (self-hosted) | Free | No per-user cost |

**Total estimated monthly cost at 1K users: ~$200-400/mo**

## Architecture Decision: Streaming Audio Pipeline

The core technical architecture for audio delivery:

```
User starts session
  -> Next.js Route Handler receives request
  -> OpenAI Responses API generates wellness guidance text (streaming)
  -> Text chunks are sent to ElevenLabs WebSocket TTS (streaming)
  -> Audio chunks are streamed back to client via ReadableStream
  -> Client plays audio chunks as they arrive (Web Audio API / HTMLAudioElement)
```

This is a **cascading streaming pipeline** -- each component starts processing as soon as it receives the first chunk from the previous component, minimizing perceived latency.

**Why not OpenAI Realtime API?** The Realtime API is designed for two-way speech-to-speech conversations (user speaks, AI responds). This product is primarily one-way: the AI guides and the user listens, with occasional text-based input for consent gates and preferences. The Realtime API would add unnecessary complexity and cost for a use case that's better served by text-LLM + TTS streaming.

## Sources

- [OpenAI Responses API docs](https://platform.openai.com/docs/guides/responses-vs-chat-completions) -- HIGH confidence
- [OpenAI Responses vs Chat Completions migration guide](https://developers.openai.com/api/docs/guides/migrate-to-responses) -- HIGH confidence
- [OpenAI TTS pricing](https://platform.openai.com/docs/pricing) -- HIGH confidence
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) -- HIGH confidence
- [ElevenLabs WebSocket docs](https://elevenlabs.io/docs/developers/websockets) -- HIGH confidence
- [ElevenLabs API pricing](https://elevenlabs.io/pricing/api) -- HIGH confidence
- [Cartesia Sonic 3 docs](https://docs.cartesia.ai/build-with-cartesia/tts-models/latest) -- MEDIUM confidence
- [Neon serverless PostgreSQL](https://neon.tech) -- HIGH confidence
- [Drizzle ORM PostgreSQL guide](https://orm.drizzle.team/docs/get-started-postgresql) -- HIGH confidence
- [Upstash Redis for Next.js](https://upstash.com/blog/session-management-nextjs) -- MEDIUM confidence
- [Auth.js v5 migration guide](https://authjs.dev/getting-started/migrating-to-v5) -- MEDIUM confidence
- [Tailwind CSS v4 release](https://tailwindcss.com/blog/tailwindcss-v4) -- HIGH confidence
- [Next.js 16 release blog](https://nextjs.org/blog/next-16) -- HIGH confidence
- [Voice AI stack for building agents (AssemblyAI)](https://www.assemblyai.com/blog/the-voice-ai-stack-for-building-agents) -- MEDIUM confidence
- [TTS comparison: ElevenLabs vs OpenAI vs Cartesia](https://cartesia.ai/vs/elevenlabs-vs-openai-tts) -- MEDIUM confidence (vendor source)
- [Best TTS APIs 2026 (Speechmatics)](https://www.speechmatics.com/company/articles-and-news/best-tts-apis-in-2025-top-12-text-to-speech-services-for-developers) -- MEDIUM confidence
- [Comparing OpenAI TTS models (TextoGo)](https://textogo.ai/blog/comparing-openai-tts-models/) -- MEDIUM confidence
- npm registry version checks -- HIGH confidence (verified 2026-02-21)
