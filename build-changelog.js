const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak
} = require("docx");

// ── Constants ──
const PAGE_WIDTH = 12240;
const MARGIN = 1440;
const CW = PAGE_WIDTH - 2 * MARGIN; // 9360

// ── Colors ──
const C = {
  primary: "0F172A",
  accent: "3B82F6",
  accent2: "8B5CF6",
  green: "059669",
  orange: "D97706",
  red: "DC2626",
  headerBg: "0F172A",
  headerText: "FFFFFF",
  rowAlt: "F8FAFC",
  rowWhite: "FFFFFF",
  border: "E2E8F0",
  text: "1E293B",
  muted: "64748B",
  phaseBg: "EFF6FF",
  featBg: "F0FDF4",
  fixBg: "FFFBEB",
  docsBg: "F5F3FF",
};

// ── Helpers ──
const bdr = { style: BorderStyle.SINGLE, size: 1, color: C.border };
const borders = { top: bdr, bottom: bdr, left: bdr, right: bdr };
const cm = { top: 50, bottom: 50, left: 100, right: 100 };
const noBdr = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBdr, bottom: noBdr, left: noBdr, right: noBdr };

function hCell(text, w) {
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: { fill: C.headerBg, type: ShadingType.CLEAR },
    margins: cm,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: "Arial", size: 17, color: C.headerText })] })],
  });
}

function dCell(text, w, alt = false, opts = {}) {
  const color = opts.color || C.text;
  const runs = [new TextRun({ text, font: opts.mono ? "Courier New" : "Arial", size: opts.size || 17, color, bold: opts.bold, italics: opts.italic })];
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: { fill: alt ? C.rowAlt : C.rowWhite, type: ShadingType.CLEAR },
    margins: cm,
    children: [new Paragraph({ children: runs })],
  });
}

function tagCell(text, w, alt, type) {
  const colors = { feat: { bg: "DCFCE7", fg: "166534" }, fix: { bg: "FEF9C3", fg: "854D0E" }, docs: { bg: "EDE9FE", fg: "5B21B6" }, test: { bg: "DBEAFE", fg: "1E40AF" }, chore: { bg: "F1F5F9", fg: "475569" } };
  const c = colors[type] || colors.chore;
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: { fill: alt ? C.rowAlt : C.rowWhite, type: ShadingType.CLEAR },
    margins: cm,
    children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 16, color: c.fg, bold: true })] })],
  });
}

function makeTable(headers, rows, colWidths) {
  return new Table({
    width: { size: colWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: headers.map((h, i) => hCell(h, colWidths[i])) }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => {
          if (typeof cell === "object" && cell._tag) return tagCell(cell.text, colWidths[ci], ri % 2 === 1, cell._tag);
          return dCell(String(cell), colWidths[ci], ri % 2 === 1);
        }),
      })),
    ],
  });
}

function tag(text, type) { return { _tag: type, text }; }

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 32, color: C.primary })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 160 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 26, color: C.accent })] });
}
function h3(text) {
  return new Paragraph({ spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 22, color: C.accent2 })] });
}
function p(text, opts = {}) {
  return new Paragraph({ spacing: { after: opts.after || 100 },
    children: [new TextRun({ text, font: "Arial", size: opts.size || 19, color: opts.color || C.text, bold: opts.bold, italics: opts.italic })] });
}
function bullet(text, ref) {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 50 },
    children: [new TextRun({ text, font: "Arial", size: 18 })] });
}
function spacer() { return new Paragraph({ spacing: { after: 60 }, children: [] }); }

// ── Data ──
const phases = [
  {
    id: "Setup", title: "Project Initialization", commits: 5,
    desc: "Project scaffolding, research synthesis, requirements definition, and 9-phase roadmap creation.",
    files: ["PROJECT.md", "config.json", "REQUIREMENTS.md", "ROADMAP.md", "STATE.md", "research/*"],
    lines: 0,
    keyChanges: [
      { type: "docs", text: "Initialize PROJECT.md with project vision, scope, and constraints" },
      { type: "chore", text: "Add project config (config.json)" },
      { type: "docs", text: "Complete research: architecture, features, pitfalls, stack, summary" },
      { type: "docs", text: "Define v1 requirements with acceptance criteria" },
      { type: "docs", text: "Create 9-phase roadmap with STATE.md tracking" },
    ],
  },
  {
    id: "Phase 01", title: "Scaffolding, Auth & Data Layer", commits: 8,
    desc: "Next.js 16 project scaffold, Drizzle ORM schema (users, sessions), Redis session store, Auth.js v5 with Credentials + JWT, protected routes, login/register UI.",
    files: [
      "src/app/layout.tsx", "src/app/page.tsx", "src/lib/db/schema.ts", "src/lib/db/index.ts",
      "src/lib/env.ts", "src/lib/redis.ts", "src/lib/session-store.ts", "src/lib/auth.ts",
      "src/actions/auth.ts", "src/app/api/auth/[...nextauth]/route.ts", "src/proxy.ts",
      "src/components/auth/login-form.tsx", "src/components/auth/register-form.tsx",
      "src/app/(auth)/login/page.tsx", "src/app/(auth)/register/page.tsx",
      "src/app/(protected)/dashboard/page.tsx",
    ],
    keyChanges: [
      { type: "feat", text: "Next.js 16 project with Tailwind, Drizzle, Redis dependencies" },
      { type: "feat", text: "Drizzle schema: users table with adult verification, consent columns" },
      { type: "feat", text: "Redis client + session store with TTL (3600s)" },
      { type: "feat", text: "Auth.js v5 with Credentials provider and JWT strategy" },
      { type: "feat", text: "Login/register forms, protected dashboard, route protection proxy" },
    ],
  },
  {
    id: "Phase 02", title: "Safety, Consent & Content Filtering", commits: 12,
    desc: "Three-layer content safety pipeline (system prompt + moderation API + keyword blocklist), consent data layer, crisis detection, consent UI flow, legal pages.",
    files: [
      "src/lib/safety/constants.ts", "src/lib/safety/moderation.ts", "src/lib/safety/keyword-blocklist.ts",
      "src/lib/safety/crisis-detector.ts", "src/lib/safety/index.ts", "src/lib/safety/system-prompt-safety.ts",
      "src/lib/consent/checks.ts", "src/lib/consent/constants.ts", "src/lib/consent/index.ts",
      "src/actions/consent.ts", "src/components/consent/age-gate.tsx", "src/components/consent/tos-acceptance.tsx",
      "src/components/consent/ai-disclosure.tsx", "src/components/consent/sensory-consent.tsx",
      "src/components/safety/crisis-banner.tsx", "src/app/(legal)/privacy/page.tsx", "src/app/(legal)/terms/page.tsx",
    ],
    keyChanges: [
      { type: "feat", text: "OpenAI Moderation API wrapper (omni-moderation-latest, 0.8 sexual threshold)" },
      { type: "feat", text: "60+ keyword blocklist with word-boundary regex matching" },
      { type: "feat", text: "Crisis detector: 12 self-harm phrases triggering 988/SAMHSA helpline" },
      { type: "feat", text: "System prompt safety template injected into all LLM calls" },
      { type: "feat", text: "Consent data layer: age verification, ToS, medical disclaimer" },
      { type: "feat", text: "Consent flow UI: age gate, ToS acceptance, AI disclosure, sensory consent" },
      { type: "feat", text: "Crisis banner component with helpline resources" },
      { type: "feat", text: "Legal pages: privacy policy and terms of service" },
    ],
  },
  {
    id: "Phase 03", title: "LLM Streaming & Sentence Chunking", commits: 8,
    desc: "Sentence boundary chunker for TTS-ready output, three-stage LLM streaming pipeline with safety filter integration.",
    files: [
      "src/lib/llm/sentence-chunker.ts", "src/lib/llm/__tests__/sentence-chunker.test.ts",
      "src/lib/llm/generate-session.ts", "src/lib/llm/index.ts", "src/lib/llm/prompts.ts",
    ],
    keyChanges: [
      { type: "test", text: "Failing tests for sentence boundary chunker (TDD approach)" },
      { type: "feat", text: "Sentence boundary chunker with abbreviation handling and min-length threshold" },
      { type: "feat", text: "Three-stage streaming pipeline: LLM tokens -> sentence chunks -> safety filter" },
      { type: "feat", text: "System prompt composition with SYSTEM_BASE persona" },
    ],
  },
  {
    id: "Phase 04", title: "TTS, WebSocket Gateway & Audio", commits: 12,
    desc: "ElevenLabs TTS integration, WebSocket real-time gateway, audio pipeline, client-side audio playback queue and hooks.",
    files: [
      "src/lib/tts/elevenlabs-client.ts", "src/lib/tts/tts-service.ts", "src/lib/tts/audio-pipeline.ts",
      "src/lib/tts/index.ts", "src/lib/ws/message-types.ts", "src/lib/ws/session-handler.ts",
      "src/lib/ws/index.ts", "src/app/api/session/ws/route.ts",
      "src/hooks/use-audio-queue.ts", "src/hooks/use-session-ws.ts",
    ],
    keyChanges: [
      { type: "feat", text: "ElevenLabs SDK integration with Flash v2.5 model (75ms TTFB)" },
      { type: "feat", text: "Cascading audio pipeline: LLM -> sentence chunks -> TTS -> MP3 stream" },
      { type: "feat", text: "WebSocket message protocol: typed client/server messages" },
      { type: "feat", text: "WebSocket route handler and session handler with auth" },
      { type: "feat", text: "AudioPlaybackQueue: client-side MP3 decode and sequential playback" },
      { type: "feat", text: "useSessionWebSocket hook for end-to-end client integration" },
    ],
  },
  {
    id: "Phase 05", title: "Session State Machine & Orchestration", commits: 10,
    desc: "5-phase session state machine, multi-phase orchestrator with budget tracking, WebSocket handler integration.",
    files: [
      "src/lib/session/phase-machine.ts", "src/lib/session/phase-config.ts",
      "src/lib/session/phase-prompts.ts", "src/lib/session/orchestrator.ts",
      "src/lib/session/index.ts",
    ],
    keyChanges: [
      { type: "feat", text: "Session phase state machine: atmosphere -> breathing -> sensory -> relaxation -> resolution" },
      { type: "feat", text: "Phase timing config: proportional budgets (12/20/28/25/15%)" },
      { type: "feat", text: "Phase-specific prompts with tone, pacing, and transition hints" },
      { type: "feat", text: "SessionOrchestrator: multi-phase async generator with budget tracking" },
      { type: "feat", text: "WebSocket handler wired to orchestrator with phase events" },
    ],
  },
  {
    id: "Phase 06", title: "Client UI, Theme & Voice-First Session", commits: 8,
    desc: "Dark gradient theme tokens, mobile viewport config, voice-first session page with breathing orb.",
    files: [
      "src/app/globals.css", "src/app/(protected)/session/page.tsx",
      "src/components/session/session-screen.tsx", "src/components/session/breathing-orb.tsx",
    ],
    keyChanges: [
      { type: "feat", text: "Expanded CSS theme tokens with gradient backgrounds" },
      { type: "feat", text: "Mobile viewport configuration (standalone, fullscreen)" },
      { type: "feat", text: "Themed dashboard with gradient background and session CTA" },
      { type: "feat", text: "Breathing orb component with CSS animations" },
      { type: "feat", text: "Voice-first session page and SessionScreen component" },
    ],
  },
  {
    id: "Phase 07", title: "Session UX, Controls & Consent Flow", commits: 8,
    desc: "Pre-session flow with length selection and conversational consent, session controls, phase indicator.",
    files: [
      "src/components/session/pre-session-flow.tsx", "src/components/session/session-controls.tsx",
      "src/components/session/phase-indicator.tsx",
    ],
    keyChanges: [
      { type: "feat", text: "WebSocket protocol extended with client-selected session length" },
      { type: "feat", text: "PreSessionFlow: length selection (10/15/20/30 min) + conversational consent" },
      { type: "feat", text: "SessionControls: pause/resume/stop with visual feedback" },
      { type: "feat", text: "PhaseIndicator: shows current phase in 5-phase progression" },
    ],
  },
  {
    id: "Phase 08", title: "Payment Integration (CCBill)", commits: 8,
    desc: "Payment backend with CCBill integration, checkout flow, webhook processing, subscription management, subscribe UI.",
    files: [
      "src/lib/payment/ccbill-config.ts", "src/lib/payment/checkout.ts",
      "src/lib/payment/webhook-handler.ts", "src/lib/payment/subscription.ts",
      "src/lib/payment/index.ts", "src/actions/payment.ts",
      "src/app/api/webhooks/ccbill/route.ts",
      "src/app/(protected)/subscribe/page.tsx", "src/app/(protected)/subscribe/success/page.tsx",
      "src/app/(protected)/subscribe/failure/page.tsx",
    ],
    keyChanges: [
      { type: "feat", text: "CCBill config with FlexForms checkout URL generation" },
      { type: "feat", text: "Webhook handler: signature verification, event processing (new sale, rebill, chargeback, cancellation)" },
      { type: "feat", text: "Subscription management: status checks, cancellation" },
      { type: "feat", text: "Payment server actions for client-side integration" },
      { type: "feat", text: "Subscribe pages: pricing, success, failure flows" },
      { type: "feat", text: "Subscription gating in proxy.ts route protection" },
    ],
  },
  {
    id: "Phase 09", title: "Differentiators & Polish", commits: 10,
    desc: "Mood-adaptive prompts, voice selection, ambient soundscapes, volume mixing, post-session screen, full UI integration.",
    files: [
      "src/lib/session/mood-prompts.ts", "src/lib/tts/voice-options.ts",
      "src/hooks/use-ambient-audio.ts", "src/components/session/volume-mixer.tsx",
      "src/components/session/mood-selector.tsx", "src/components/session/voice-picker.tsx",
      "src/components/session/post-session-screen.tsx",
    ],
    keyChanges: [
      { type: "feat", text: "5 mood options (anxious/sad/stressed/neutral/restless) with prompt modifiers" },
      { type: "feat", text: "3 voice options (Emily/Rachel/George) with ElevenLabs IDs" },
      { type: "feat", text: "Voice settings: TTS_CONFIG with stability, speed, style tuning" },
      { type: "feat", text: "5 ambient soundscapes (rain/ocean/forest/ambient/silence)" },
      { type: "feat", text: "useAmbientAudio hook with GainNode routing" },
      { type: "feat", text: "VolumeMixer: click-free volume sliders for voice + ambient" },
      { type: "feat", text: "MoodSelector, VoicePicker, PostSessionScreen components" },
      { type: "feat", text: "Full integration into PreSessionFlow and SessionScreen" },
    ],
  },
  {
    id: "Post-Phase", title: "Bug Fixes, Schema Overhaul & Uncensored Path", commits: 4,
    desc: "Dev preview fixes, CCBill dev placeholders, ElevenLabs audio buffering, database schema overhaul with rehabilitation tables, LLM uncensored path with characters/modes/guardrails.",
    files: [
      "src/lib/db/schema.ts", "src/lib/llm/client.ts", "src/lib/llm/guardrails.ts",
      "src/lib/llm/schema.ts", "src/lib/llm/prompts.ts", "src/lib/safety/guardrails.ts",
      "src/lib/llm/llmModeration.ts",
    ],
    keyChanges: [
      { type: "fix", text: "Dev preview: lazy init, cookie clearing, audio error handling" },
      { type: "fix", text: "CCBill config: dev placeholders in development mode" },
      { type: "fix", text: "ElevenLabs: API key passing + MP3 chunk buffering for decodeAudioData" },
      { type: "feat", text: "Database schema overhaul: injury profiles, exercises, session plans, session logs, progress snapshots" },
      { type: "feat", text: "LLM uncensored client: Groq API, llama-3.1-70b, temperature 1.2/1.5" },
      { type: "feat", text: "3 character personas (Thea/Mari/Milfen) with buildCharacterPrompt()" },
      { type: "feat", text: "4 interaction modes (desperate/rough/humiliating/fetish)" },
      { type: "feat", text: "KnullResponseSchema: mood, action, intensity, escalation Zod schema" },
      { type: "feat", text: "Voice coach guardrails: 40+ prohibited phrases, red-flag detection, pain protocol" },
      { type: "feat", text: "Jailbreak toggle: JAILBREAK_V1 prompt, temperature override to 1.5" },
    ],
  },
];

// ── Build ──
const children = [];

// ── Title page ──
children.push(new Paragraph({ spacing: { before: 2000 }, children: [] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
  children: [new TextRun({ text: "CHANGELOG", font: "Arial", size: 60, bold: true, color: C.primary })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [new TextRun({ text: "Complete Development History", font: "Arial", size: 32, color: C.accent })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
  children: [new TextRun({ text: "All changes from project initialization through current state", font: "Arial", size: 20, color: C.muted, italics: true })] }));

// Stats box
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
  children: [new TextRun({ text: "February 21, 2026", font: "Arial", size: 20, color: C.muted })] }));
children.push(spacer());

children.push(makeTable(
  ["Metric", "Value"],
  [
    ["Total Commits", "91"],
    ["Source Files", "120"],
    ["TypeScript/TSX Lines", "6,726"],
    ["Development Phases", "9 + post-phase fixes"],
    ["Drizzle Migrations", "4 (0000-0003)"],
    ["Components", "15 React components"],
    ["Server Actions", "3 (auth, consent, payment)"],
    ["API Routes", "4 (auth, session/ws, webhooks, clear-cookies)"],
    ["Custom Hooks", "3 (useAudioQueue, useSessionWS, useAmbientAudio)"],
    ["Library Modules", "28 (llm, tts, safety, session, payment, ws, consent, db)"],
  ],
  [4000, 5360]
));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── Table of Contents ──
children.push(h1("Table of Contents"));
children.push(spacer());
const tocItems = [
  "1. Project Initialization (Setup)",
  "2. Phase 01: Scaffolding, Auth & Data Layer",
  "3. Phase 02: Safety, Consent & Content Filtering",
  "4. Phase 03: LLM Streaming & Sentence Chunking",
  "5. Phase 04: TTS, WebSocket Gateway & Audio",
  "6. Phase 05: Session State Machine & Orchestration",
  "7. Phase 06: Client UI, Theme & Voice-First Session",
  "8. Phase 07: Session UX, Controls & Consent Flow",
  "9. Phase 08: Payment Integration (CCBill)",
  "10. Phase 09: Differentiators & Polish",
  "11. Post-Phase: Bug Fixes, Schema Overhaul & Uncensored Path",
  "12. Architecture Summary",
];
tocItems.forEach(item => {
  children.push(new Paragraph({ spacing: { after: 80 }, indent: { left: 200 },
    children: [new TextRun({ text: item, font: "Arial", size: 20, color: C.accent })] }));
});

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── Per-phase sections ──
phases.forEach((phase, idx) => {
  // Phase header
  children.push(h1(`${idx + 1}. ${phase.id}: ${phase.title}`));
  children.push(p(phase.desc, { italic: true, color: C.muted, size: 18 }));
  children.push(p(`${phase.commits} commits`, { color: C.accent, bold: true, size: 17 }));
  children.push(spacer());

  // Key changes table
  children.push(h3("Changes"));
  const changeRows = phase.keyChanges.map(kc => [tag(kc.type.toUpperCase(), kc.type), kc.text]);
  children.push(makeTable(["Type", "Description"], changeRows, [1000, 8360]));
  children.push(spacer());

  // Files touched
  children.push(h3("Key Files"));
  phase.files.forEach(f => {
    children.push(new Paragraph({ spacing: { after: 30 }, indent: { left: 300 },
      children: [new TextRun({ text: f, font: "Courier New", size: 16, color: C.muted })] }));
  });

  // Page break between phases (except last)
  if (idx < phases.length - 1) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }
});

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── Architecture Summary ──
children.push(h1("12. Architecture Summary"));
children.push(spacer());

children.push(h2("Technology Stack"));
children.push(makeTable(
  ["Layer", "Technology", "Version/Config"],
  [
    ["Framework", "Next.js", "16 (App Router)"],
    ["Language", "TypeScript", "5.x"],
    ["Styling", "Tailwind CSS", "4.x"],
    ["Database", "PostgreSQL + Drizzle ORM", "4 migrations"],
    ["Cache/Sessions", "Redis (Upstash)", "TTL 3600s"],
    ["Auth", "Auth.js (NextAuth v5)", "Credentials + JWT"],
    ["LLM (Wellness)", "OpenAI GPT-4.1-mini", "temp 0.8"],
    ["LLM (Uncensored)", "Groq / Llama 3.1 70B", "temp 1.2-1.5"],
    ["TTS", "ElevenLabs Flash v2.5", "75ms TTFB"],
    ["Real-time", "WebSocket (next-ws)", "Binary MP3 frames"],
    ["Payments", "CCBill FlexForms", "Webhook verification"],
    ["Testing", "Vitest", "TDD for chunker"],
  ],
  [2200, 3400, 3760]
));

children.push(spacer());
children.push(h2("Directory Structure"));
children.push(makeTable(
  ["Directory", "Purpose", "Files"],
  [
    ["src/lib/llm/", "LLM clients, prompts, schemas, guardrails, streaming", "8"],
    ["src/lib/safety/", "Moderation, keyword blocklist, crisis detection, guardrails", "7"],
    ["src/lib/session/", "Phase machine, orchestrator, mood prompts, phase config", "6"],
    ["src/lib/tts/", "ElevenLabs client, TTS service, audio pipeline, voice options", "5"],
    ["src/lib/ws/", "WebSocket message types, session handler", "3"],
    ["src/lib/payment/", "CCBill config, checkout, webhooks, subscriptions", "5"],
    ["src/lib/consent/", "Consent checks, constants", "3"],
    ["src/lib/db/", "Drizzle schema, database client", "2"],
    ["src/components/session/", "Session UI: screen, controls, orb, selectors, mixer", "9"],
    ["src/components/consent/", "Age gate, ToS, AI disclosure, sensory consent", "4"],
    ["src/components/auth/", "Login and register forms", "2"],
    ["src/components/safety/", "Crisis banner", "1"],
    ["src/hooks/", "Audio queue, WebSocket, ambient audio", "3"],
    ["src/actions/", "Server actions: auth, consent, payment", "3"],
    ["src/app/api/", "API routes: auth, WebSocket, webhooks, cookies", "4"],
  ],
  [2400, 4760, 2200]
));

children.push(spacer());
children.push(h2("Data Flow"));
children.push(makeTable(
  ["Step", "Component", "Output"],
  [
    ["1", "PreSessionFlow (mood + voice + length)", "Config sent via WebSocket"],
    ["2", "WebSocket Handler", "Creates SessionOrchestrator"],
    ["3", "SessionOrchestrator (5 phases)", "Phase events + sentences"],
    ["4", "streamLlmTokens (GPT-4.1-mini)", "Token stream"],
    ["5", "chunkBySentence", "Complete sentences"],
    ["6", "Safety filter (3 layers)", "Filtered sentences"],
    ["7", "TTS service (ElevenLabs)", "MP3 audio chunks"],
    ["8", "WebSocket binary frames", "Sent to client"],
    ["9", "AudioPlaybackQueue", "Sequential playback"],
    ["10", "SessionScreen + Breathing Orb", "Visual feedback"],
  ],
  [800, 4000, 4560]
));

children.push(spacer());
children.push(h2("Dual System Architecture"));
children.push(p("The codebase contains two parallel agent systems with different safety profiles:"));
children.push(spacer());
children.push(makeTable(
  ["Aspect", "Wellness / Rehab Path", "Knull / Uncensored Path"],
  [
    ["Model", "gpt-4.1-mini (OpenAI)", "llama-3.1-70b-versatile (Groq)"],
    ["Temperature", "0.8", "1.2 / 1.5 (jailbreak)"],
    ["Language", "English", "Norwegian"],
    ["Safety Layers", "3 (system prompt + moderation API + blocklist)", "1 (child-abuse/hate only)"],
    ["Content", "Wellness, breathing, relaxation", "Explicit sexual + drug themes"],
    ["Characters", "Generic wellness guide", "Thea, Mari, Milfen"],
    ["User Selects", "Mood, voice, soundscape, length", "Character, mode, jailbreak"],
    ["Guardrails", "40+ prohibited phrases, crisis detection", "Minimal (underage + non-fiction violence)"],
    ["Schema", "N/A (free-form text)", "Zod: mood, action, intensity, escalation"],
    ["Censorship", "Heavy (60+ keywords)", "Near-zero (applyPrettyGirlFilter only)"],
  ],
  [2000, 3680, 3680]
));

// ── Full commit log ──
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Appendix: Full Commit Log (91 commits)"));
children.push(spacer());

const commits = [
  ["9a2c8d5", "docs", "docs: initialize project"],
  ["bf6ebf9", "chore", "chore: add project config"],
  ["8b2b27d", "docs", "docs: complete project research"],
  ["beca695", "docs", "docs: define v1 requirements"],
  ["c42480b", "docs", "docs: create roadmap (9 phases)"],
  ["e1acc4d", "docs", "docs(1): research phase domain"],
  ["5a6c102", "docs", "docs(01): create phase plan"],
  ["06e8e89", "feat", "feat(01-01): scaffold Next.js 16 project"],
  ["d921760", "feat", "feat(01-01): add Drizzle schema, Redis, session store"],
  ["ef2640f", "docs", "docs(01-01): complete scaffolding plan"],
  ["8fd5203", "feat", "feat(01-02): configure Auth.js v5"],
  ["be25c63", "feat", "feat(01-02): add auth pages, dashboard, route protection"],
  ["e9ba220", "docs", "docs(01-02): complete authentication plan"],
  ["a41559e", "docs", "docs(02): research safety & consent"],
  ["3c46ec6", "docs", "docs(02): create phase plan"],
  ["1b1c52f", "feat", "feat(02-01): extend schema with consent tables"],
  ["c82d1f9", "feat", "feat(02-02): create safety modules"],
  ["4e06e5d", "feat", "feat(02-01): add consent actions, checks, proxy"],
  ["008fd86", "feat", "feat(02-02): compose safety filter + system prompt"],
  ["38d5a5d", "docs", "docs(02-01): complete consent data layer plan"],
  ["70b60b8", "docs", "docs(02-02): complete content safety pipeline plan"],
  ["ccc855d", "feat", "feat(02-03): create consent flow pages"],
  ["d18c8cd", "feat", "feat(02-03): create legal pages, AI disclosure, crisis banner"],
  ["5a7c232", "docs", "docs(02-03): complete consent UI plan"],
  ["49ff49d", "docs", "docs(03): research LLM streaming"],
  ["4a4a27d", "docs", "docs(03): create phase plan"],
  ["29b8b45", "test", "test(03-01): add failing tests for chunker"],
  ["cc8cf7a", "feat", "feat(03-01): implement sentence boundary chunker"],
  ["79a4154", "docs", "docs(03-01): complete chunker plan"],
  ["6091665", "feat", "feat(03-02): add LLM streaming pipeline + safety filter"],
  ["3423548", "docs", "docs(03-02): complete LLM pipeline plan"],
  ["f57d342", "docs", "docs(04): research TTS & WebSocket"],
  ["b2af2f8", "docs", "docs(04): create phase plan"],
  ["abc54f1", "feat", "feat(04-02): install next-ws, create WS protocol"],
  ["f233095", "feat", "feat(04-01): install ElevenLabs SDK, create TTS service"],
  ["1ce06d9", "feat", "feat(04-02): create WebSocket handler"],
  ["e9470a3", "feat", "feat(04-01): create cascading audio pipeline"],
  ["5c9ac92", "docs", "docs(04-02): complete WebSocket gateway plan"],
  ["582253c", "docs", "docs(04-01): complete TTS service plan"],
  ["62ecbcc", "feat", "feat(04-03): create AudioPlaybackQueue + useAudioQueue"],
  ["40083c7", "feat", "feat(04-03): create useSessionWebSocket hook"],
  ["56a115e", "docs", "docs(04-03): complete client audio plan"],
  ["ac0324f", "docs", "docs(05): research session state machine"],
  ["21c4432", "docs", "docs(05): create phase plan"],
  ["c3e7132", "feat", "feat(05-01): create phase state machine"],
  ["e28b216", "feat", "feat(05-01): add phase prompts, timing, exports"],
  ["ac8e543", "docs", "docs(05-01): complete phase machine plan"],
  ["e1b6626", "feat", "feat(05-02): extend streaming + SessionState"],
  ["30d3085", "feat", "feat(05-02): create SessionOrchestrator"],
  ["c9602a0", "docs", "docs(05-02): complete orchestrator plan"],
  ["8fd3292", "feat", "feat(05-03): extend ServerMessage types"],
  ["d950b28", "feat", "feat(05-03): wire orchestrator into WS handler"],
  ["5cae375", "docs", "docs(05-03): complete WS integration plan"],
  ["1022ed2", "docs", "docs(06): research client UI & theme"],
  ["3c7e4ed", "docs", "docs(06): create phase plan"],
  ["c591dad", "feat", "feat(06-01): expand theme tokens, mobile viewport"],
  ["f412518", "feat", "feat(06-01): theme dashboard with gradient + CTA"],
  ["f0944d2", "docs", "docs(06-01): complete theme plan"],
  ["482204d", "feat", "feat(06-02): add phase tracking + breathing orb"],
  ["734139d", "feat", "feat(06-02): create session page + SessionScreen"],
  ["7120d7e", "docs", "docs(06-02): complete session screen plan"],
  ["a893b56", "docs", "docs(07): research session UX & controls"],
  ["a70f8fb", "docs", "docs(07): create phase plan"],
  ["bda378f", "feat", "feat(07-01): extend WS protocol with session length"],
  ["7475639", "feat", "feat(07-01): build PreSessionFlow"],
  ["c95cef3", "docs", "docs(07-01): complete pre-session flow plan"],
  ["65d8088", "feat", "feat(07-02): create SessionControls + PhaseIndicator"],
  ["b97bd56", "feat", "feat(07-02): integrate Phase 7 into SessionScreen"],
  ["e5ffd61", "docs", "docs(07-02): complete controls plan"],
  ["d4b3f1b", "docs", "docs(08): research payment integration"],
  ["9e3d612", "docs", "docs(08): create phase plan"],
  ["a68f94a", "feat", "feat(08-01): extend schema + env for payments"],
  ["36eac66", "feat", "feat(08-01): create payment module"],
  ["7c07264", "docs", "docs(08-01): complete payment backend plan"],
  ["e0c6d0b", "feat", "feat(08-02): add webhook endpoint + payment actions"],
  ["7478879", "feat", "feat(08-02): add subscribe pages + gating"],
  ["efe0c17", "docs", "docs(08-02): complete payment wiring plan"],
  ["cc3a9ca", "docs", "docs(09): research differentiators"],
  ["cdf6376", "docs", "docs(09): create phase plan"],
  ["9d13f0e", "feat", "feat(09-01): add mood prompts, voice options"],
  ["5ad69fc", "feat", "feat(09-02): refactor audio + ambient hook"],
  ["676e396", "feat", "feat(09-02): add VolumeMixer"],
  ["aba903f", "feat", "feat(09-01): wire mood/voiceId through WS"],
  ["029e48a", "docs", "docs(09-02): complete audio mixing plan"],
  ["97f3d23", "docs", "docs(09-01): complete mood/voice plan"],
  ["b531090", "feat", "feat(09-03): create MoodSelector, VoicePicker, PostSession"],
  ["6577124", "feat", "feat(09-03): wire differentiators into UI"],
  ["0a2e0b1", "docs", "docs(09-03): complete differentiator plan"],
  ["a856b8b", "fix", "fix: dev preview fixes"],
  ["775112b", "fix", "fix: CCBill dev placeholders"],
  ["b05f136", "fix", "fix: ElevenLabs API key + MP3 buffering"],
  ["a3f6598", "feat", "feat: DB schema overhaul, LLM guardrails, welcome styling"],
];

const commitRows = commits.map(([hash, type, msg]) => [
  { _tag: type, text: hash },
  tag(type.toUpperCase(), type),
  msg,
]);
children.push(makeTable(["Hash", "Type", "Message"], commitRows, [1200, 900, 7260]));

// ── Assemble ──
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 19 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: C.primary },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: C.accent },
        paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_WIDTH, height: 15840 },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
      },
    },
    headers: {
      default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "Changelog \u2014 Complete Development History", font: "Arial", size: 15, color: C.muted, italics: true })] })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Page ", font: "Arial", size: 15, color: C.muted }),
          new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 15, color: C.muted }),
        ] })] }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  const out = "/Users/torbjorntest/female/Changelog-All-Changes.docx";
  fs.writeFileSync(out, buffer);
  console.log("Created: " + out + " (" + Math.round(buffer.length / 1024) + " KB)");
});
