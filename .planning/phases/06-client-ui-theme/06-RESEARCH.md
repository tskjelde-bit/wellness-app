# Phase 6: Client UI & Theme - Research

**Researched:** 2026-02-21
**Domain:** Frontend UI theming, mobile-first responsive design, voice-first session interface
**Confidence:** HIGH

## Summary

Phase 6 transforms the existing functional dashboard into a polished, pink wellness-themed interface optimized for mobile browsers with a voice-first session experience. The project already has a solid foundation: Tailwind CSS v4 with four custom theme colors (`blush`, `rose`, `charcoal`, `cream`) defined via the `@theme` directive in `globals.css`, existing component patterns using these tokens consistently (login form, consent components, dashboard), and working client hooks (`useSessionWebSocket`, `useAudioQueue`) that handle WebSocket connection, audio playback, and session lifecycle.

The primary work is: (1) expanding the theme token set to cover the full design system (gradients, shadows, animations, spacing), (2) building a mobile-optimized responsive layout with proper viewport configuration, (3) creating a voice-first session screen with minimal visual chrome that integrates the existing `useSessionWebSocket` hook, and (4) adding a "Start New Session" flow from the dashboard. No new libraries are needed -- the existing Tailwind CSS v4, React 19, and Next.js 16 stack provides everything required.

**Primary recommendation:** Build on the existing theme tokens and client hooks. The session screen should be a new client component that composes `useSessionWebSocket` and shows a single large breathing animation as the primary visual during playback, with the "Start Session" button on the dashboard as the entry point.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | Pink wellness theme applied consistently (blush #F8C8DC, rose #D63384, charcoal #2B2B2B) | Theme tokens already exist in `globals.css` via `@theme`. Expand with gradients, shadows, animations. Apply consistently across all pages using established component patterns. |
| UI-02 | Responsive layout optimized for mobile browsers | Next.js 16 viewport API (`export const viewport`), Tailwind v4 mobile-first breakpoints, safe-area-inset CSS for notched devices, touch-friendly tap targets (min 44px). |
| UI-05 | Minimal visual chrome during active sessions -- voice-first, screen-secondary | Session screen shows breathing/pulse animation as primary visual, dim text overlay for current sentence, no navigation chrome. Fullscreen-feel layout with dark/muted background. |
| SESS-07 | User can start a new session from the main screen | Dashboard gets a "Start Session" CTA button. On click: navigate to session page or enter session mode, call `connect()` then `startSession()` from `useSessionWebSocket` hook (user gesture satisfies AudioContext policy). |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.x | Utility-first CSS with `@theme` design tokens | Already installed. v4 CSS-first config with `@theme` directive is the project standard. |
| React | 19.2.3 | UI components | Already installed. `useActionState`, hooks-first patterns already in use. |
| Next.js | 16.1.6 | App Router, server components, viewport API | Already installed. Static `viewport` export for mobile meta tags. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | -- | -- | All UI requirements are achievable with existing Tailwind + React + Next.js stack |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure Tailwind animations | Framer Motion | Adds 30KB+ bundle weight; CSS animations sufficient for breathing/pulse effects |
| Tailwind responsive utilities | CSS container queries | Container queries add complexity; standard breakpoints sufficient for this layout |

**Installation:**
```bash
# No new packages required
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (protected)/
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Dashboard with "Start Session" CTA
│   │   └── session/
│   │       └── page.tsx           # Voice-first session screen (client component)
│   └── globals.css                # Expanded @theme tokens
├── components/
│   ├── session/
│   │   ├── session-screen.tsx     # Main session UI (composes useSessionWebSocket)
│   │   └── breathing-orb.tsx      # Animated breathing visual
│   └── ui/
│       └── button.tsx             # Shared themed button (optional extraction)
└── hooks/
    ├── use-session-ws.ts          # EXISTING -- WebSocket + audio integration
    └── use-audio-queue.ts         # EXISTING -- AudioPlaybackQueue
```

### Pattern 1: Voice-First Session Screen

**What:** A fullscreen client component that maximizes audio experience and minimizes visual distraction. The screen shows a single animated "breathing orb" as the primary visual, with the current sentence text as a subtle overlay that fades in/out. No navigation bar, no sidebar, no unnecessary chrome.

**When to use:** During an active audio session where the user is primarily listening.

**Example:**
```typescript
// Source: Project architecture pattern based on useSessionWebSocket hook API
"use client";

import { useSessionWebSocket } from "@/hooks/use-session-ws";
import { BreathingOrb } from "@/components/session/breathing-orb";

export function SessionScreen() {
  const {
    connect,
    startSession,
    endSession,
    isConnected,
    isPlaying,
    currentText,
    error,
  } = useSessionWebSocket();

  const handleStart = () => {
    connect();       // AudioContext created in user gesture
    startSession();  // Send start_session command
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-charcoal">
        <button onClick={handleStart} className="...">
          Begin Session
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-charcoal">
      <BreathingOrb isPlaying={isPlaying} />
      {currentText && (
        <p className="mt-8 max-w-sm text-center text-cream/70 text-sm">
          {currentText}
        </p>
      )}
    </div>
  );
}
```

### Pattern 2: Expanded Theme Token System

**What:** Extend the existing `@theme` block to include gradients, shadows, animations, and spacing tokens for a cohesive design system.

**When to use:** All UI components should reference theme tokens rather than raw values.

**Example:**
```css
/* Source: Tailwind CSS v4 official docs -- @theme directive */
@import "tailwindcss";

@theme {
  /* Existing colors */
  --color-blush: #F8C8DC;
  --color-rose: #D63384;
  --color-charcoal: #2B2B2B;
  --color-cream: #FFF5F7;

  /* Extended color palette */
  --color-blush-light: #FDE8F0;
  --color-rose-dark: #B02A6E;
  --color-charcoal-light: #4A4A4A;

  /* Shadows */
  --shadow-soft: 0 4px 20px rgba(214, 51, 132, 0.15);
  --shadow-glow: 0 0 30px rgba(248, 200, 220, 0.4);

  /* Border radius */
  --radius-card: 1rem;
  --radius-button: 0.5rem;

  /* Animations */
  --animate-breathe: breathe 4s ease-in-out infinite;
  --animate-fade-in: fadeIn 0.5s ease-out;
  --animate-pulse-soft: pulseSoft 3s ease-in-out infinite;

  @keyframes breathe {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.08); opacity: 1; }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulseSoft {
    0%, 100% { box-shadow: 0 0 20px rgba(248, 200, 220, 0.3); }
    50% { box-shadow: 0 0 40px rgba(248, 200, 220, 0.6); }
  }
}
```

### Pattern 3: Mobile Viewport Configuration

**What:** Configure Next.js 16 viewport for mobile-optimized experience including theme color and safe area handling.

**When to use:** Root layout for global mobile optimization.

**Example:**
```typescript
// Source: Next.js 16.1.6 official docs -- generateViewport
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,       // Prevent zoom during session
  userScalable: false,    // Immersive experience
  themeColor: "#2B2B2B",  // Charcoal for status bar
  viewportFit: "cover",   // Edge-to-edge on notched devices
};
```

### Pattern 4: Session Page with connect-then-start Flow

**What:** The `useSessionWebSocket` hook requires `connect()` be called in a user gesture handler to create AudioContext. Then `startSession()` must be called after the WebSocket connection opens. This is a two-step flow that should feel like a single tap to the user.

**When to use:** Starting a new session from the dashboard.

**Example:**
```typescript
// Source: Existing use-session-ws.ts hook API
// IMPORTANT: connect() opens WebSocket + creates AudioContext (user gesture required)
// startSession() sends start_session command (only works after ws.onopen fires)
// Must handle the async gap between connect() and WebSocket.OPEN

const handleStart = () => {
  connect();  // Creates AudioContext in gesture context + opens WS
  // startSession() should be called after isConnected becomes true
};

// Use effect to start session when connection is ready
useEffect(() => {
  if (isConnected && !sessionId) {
    startSession();
  }
}, [isConnected, sessionId, startSession]);
```

### Anti-Patterns to Avoid

- **AudioContext outside user gesture:** Creating AudioContext in useEffect or on page load will be blocked by browser autoplay policy. Always create inside click/tap handler via `connect()`.
- **Heavy visual elements during session:** Avoid complex layouts, scrollable content, or interactive widgets during active sessions. The voice IS the experience; the screen is secondary.
- **Responsive-last design:** Design mobile-first, then add desktop enhancements. The primary use case is phone browsers.
- **Hardcoded color values:** Always use theme tokens (`text-charcoal`, `bg-blush`) never raw hex values. The project already follows this pattern.
- **Blocking navigation during session:** Don't prevent the user from leaving. Let the WebSocket cleanup handler (already in `useSessionWebSocket`) handle disconnection.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mobile viewport config | Manual `<meta>` tags in HTML | Next.js `viewport` export | Type-safe, handled by framework, avoids conflicts with App Router |
| Breathing/pulse animation | JavaScript `requestAnimationFrame` loops | CSS `@keyframes` via Tailwind `@theme` | GPU-accelerated, no JS thread blocking, battery-friendly on mobile |
| Audio playback queue | New audio management | Existing `useAudioQueue` hook | Already handles gap-free scheduling, pause/resume, cleanup |
| WebSocket lifecycle | New connection manager | Existing `useSessionWebSocket` hook | Already handles connect, message routing, audio integration, cleanup |
| Safe-area padding | Manual JS viewport measurement | CSS `env(safe-area-inset-*)` | Native browser support, no layout thrashing |

**Key insight:** The hardest client-side problems (audio playback, WebSocket management, session lifecycle) are already solved in Phase 4. Phase 6 is primarily a styling and layout task that composes existing hooks.

## Common Pitfalls

### Pitfall 1: AudioContext Autoplay Policy

**What goes wrong:** Session audio doesn't play on mobile Safari or Chrome -- user sees the session start but hears nothing.
**Why it happens:** Browser autoplay policies require AudioContext to be created inside a user gesture event handler (click, tap). The `connect()` function in `useSessionWebSocket` already calls `initQueue()` which creates the AudioContext, but this only works if `connect()` itself is called synchronously from a click handler.
**How to avoid:** Ensure the "Start Session" button's `onClick` directly calls `connect()`. Do not wrap it in `setTimeout`, `Promise.then()`, or call it from a `useEffect`. The existing hook handles this correctly -- just wire the button directly.
**Warning signs:** Audio works on desktop but fails silently on mobile.

### Pitfall 2: `min-h-screen` vs `min-h-dvh` on Mobile

**What goes wrong:** The session screen has a visible gap or the layout jumps when the mobile browser chrome (address bar) shows/hides.
**Why it happens:** `100vh` on mobile browsers includes the address bar height, causing layout instability. `100dvh` (dynamic viewport height) adjusts as the browser chrome appears/disappears.
**How to avoid:** Use `min-h-dvh` instead of `min-h-screen` for fullscreen mobile layouts. Tailwind CSS v4 includes `dvh` utilities.
**Warning signs:** Content appears cut off at the bottom on mobile Safari, or the page "jumps" when scrolling.

### Pitfall 3: connect() and startSession() Race Condition

**What goes wrong:** `startSession()` is called before the WebSocket connection is open, so the start command is silently dropped.
**Why it happens:** `connect()` opens a WebSocket which connects asynchronously. `startSession()` checks `ws.readyState === WebSocket.OPEN` and no-ops if not ready.
**How to avoid:** Use a `useEffect` that watches `isConnected` to trigger `startSession()` after the connection opens, rather than calling both synchronously in the same click handler.
**Warning signs:** User clicks "Start Session" and the WebSocket connects but no audio arrives. No error message because the send is silently skipped.

### Pitfall 4: Missing phase_start/phase_transition in Client Hook

**What goes wrong:** Server sends `phase_start` and `phase_transition` messages but the client hook doesn't expose them to the UI.
**Why it happens:** The current `useSessionWebSocket` hook has no case handlers for `phase_start` or `phase_transition` message types -- they fall through to the default JSON parse path with no action.
**How to avoid:** Add state for `currentPhase` to `useSessionWebSocket` and handle `phase_start` and `phase_transition` messages. Even though Phase 6 requires minimal chrome (UI-05), knowing the current phase is needed for Phase 7 (UI-04 phase indicator) and can subtly influence the breathing orb animation.
**Warning signs:** The UI cannot display which session phase is active.

### Pitfall 5: Forgetting `motion-reduce` / `prefers-reduced-motion`

**What goes wrong:** Users with vestibular disorders or motion sensitivity see constant pulsing/breathing animations that cause discomfort.
**Why it happens:** Animations are added without respecting the user's OS-level reduced motion preference.
**How to avoid:** Always add `motion-reduce:animate-none` alongside animation classes. Tailwind provides this variant out of the box.
**Warning signs:** Accessibility audit flags animations without reduced-motion alternative.

## Code Examples

Verified patterns from official sources and existing codebase:

### Expanding @theme with Custom Animations

```css
/* Source: Tailwind CSS v4 official docs (tailwindcss.com/docs/theme, tailwindcss.com/docs/animation) */
@import "tailwindcss";

@theme {
  --color-blush: #F8C8DC;
  --color-rose: #D63384;
  --color-charcoal: #2B2B2B;
  --color-cream: #FFF5F7;

  --animate-breathe: breathe 4s ease-in-out infinite;

  @keyframes breathe {
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.08); opacity: 1; }
  }
}
```

Usage:
```html
<div class="animate-breathe motion-reduce:animate-none">...</div>
```

### Next.js 16 Viewport Export

```typescript
// Source: Next.js 16.1.6 official docs (nextjs.org/docs/app/api-reference/functions/generate-viewport)
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF5F7" },  // cream
    { media: "(prefers-color-scheme: dark)", color: "#2B2B2B" },   // charcoal
  ],
};
```

### Breathing Orb Component Pattern

```tsx
// Source: Project pattern -- composing Tailwind animation tokens
export function BreathingOrb({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <div
        className={`absolute h-48 w-48 rounded-full bg-blush/20 ${
          isPlaying ? "animate-pulse-soft" : ""
        } motion-reduce:animate-none`}
      />
      {/* Inner orb */}
      <div
        className={`h-32 w-32 rounded-full bg-gradient-to-br from-blush to-rose ${
          isPlaying ? "animate-breathe" : ""
        } motion-reduce:animate-none`}
      />
    </div>
  );
}
```

### Mobile-Safe Fullscreen Layout

```tsx
// Source: MDN safe-area-inset docs + Tailwind dvh utilities
export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-dvh bg-charcoal"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {children}
    </div>
  );
}
```

### Dashboard Start Session Button

```tsx
// Source: Existing dashboard page.tsx pattern + useSessionWebSocket API
import Link from "next/link";

// In dashboard page (server component):
<Link
  href="/session"
  className="w-full rounded-lg bg-rose px-4 py-3 text-center font-medium text-white
             transition-colors hover:bg-rose/90 active:scale-[0.98]
             min-h-[44px] flex items-center justify-center"
>
  Start New Session
</Link>
```

### Handling connect-then-start Flow

```typescript
// Source: Existing use-session-ws.ts API constraints
"use client";

import { useEffect, useState } from "react";
import { useSessionWebSocket } from "@/hooks/use-session-ws";

export function SessionScreen() {
  const { connect, startSession, isConnected, sessionId, ...rest } = useSessionWebSocket();
  const [hasInitiated, setHasInitiated] = useState(false);

  const handleStart = () => {
    connect();           // Creates AudioContext + opens WS (user gesture)
    setHasInitiated(true);
  };

  // Start session once WebSocket is open
  useEffect(() => {
    if (hasInitiated && isConnected && !sessionId) {
      startSession();
    }
  }, [hasInitiated, isConnected, sessionId, startSession]);

  // ... render session UI
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` for theming | `@theme` directive in CSS (v4) | Tailwind v4 (Jan 2025) | All theme configuration in CSS, not JS. Already adopted by this project. |
| `100vh` for fullscreen mobile | `100dvh` (dynamic viewport height) | Widely supported 2023+ | Fixes mobile browser chrome issue. Tailwind v4 includes `min-h-dvh` utility. |
| Manual `<meta viewport>` tags | Next.js `viewport` export | Next.js 14+ | Type-safe viewport config, framework-managed. |
| `animation` in tailwind.config.js | `--animate-*` in `@theme` with `@keyframes` | Tailwind v4 | CSS-native animation definitions. |

**Deprecated/outdated:**
- `tailwind.config.ts` for theme customization: v4 uses `@theme` in CSS. The project has no tailwind.config file (correct).
- `100vh` on mobile: Use `dvh` units instead for reliable fullscreen.

## Open Questions

1. **Session page routing: separate page vs modal/overlay on dashboard?**
   - What we know: The existing dashboard is a server component at `/dashboard`. The session screen needs client-side hooks. A separate `/session` route is cleanest architecturally (server vs client separation).
   - What's unclear: Whether the user expects a page navigation or an in-place transition.
   - Recommendation: Use a separate `/session` route. It keeps the server-rendered dashboard and client-rendered session cleanly separated. Navigation is a single Link click.

2. **Should useSessionWebSocket be extended with phase tracking?**
   - What we know: Server sends `phase_start` and `phase_transition` messages. The client hook currently ignores them. Phase 6 requires minimal chrome (UI-05) but Phase 7 needs a phase indicator (UI-04).
   - What's unclear: Whether to add phase state now (Phase 6) or defer to Phase 7.
   - Recommendation: Add `currentPhase` state to `useSessionWebSocket` now. It's 5 lines of code, avoids rework, and enables subtle visual cues (e.g., slightly different orb color per phase) even with minimal chrome.

3. **Font choice: keep Geist or switch to a wellness-appropriate font?**
   - What we know: Root layout loads Geist Sans/Mono (default Next.js scaffold font). Geist is a clean, modern sans-serif.
   - What's unclear: Whether Geist fits the wellness brand aesthetic.
   - Recommendation: Keep Geist for v1. Font changes are low-effort but high-risk for layout issues. The pink color palette provides sufficient brand identity. Defer font exploration to a polish pass.

## Sources

### Primary (HIGH confidence)

- [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme) -- `@theme` directive, `--color-*` namespace, extending vs overriding
- [Tailwind CSS v4 Animation](https://tailwindcss.com/docs/animation) -- `--animate-*` in `@theme`, `@keyframes` syntax, `motion-reduce` variant
- [Next.js 16 generateViewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport) -- `viewport` export, themeColor, width/scale options
- Existing codebase: `src/app/globals.css`, `src/hooks/use-session-ws.ts`, `src/hooks/use-audio-queue.ts`, `src/app/(protected)/dashboard/page.tsx`, `src/components/auth/login-form.tsx`

### Secondary (MEDIUM confidence)

- [MDN Viewport meta tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag) -- viewport-fit=cover, safe-area-inset environment variables
- [WebKit: Designing for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) -- safe-area-inset-* CSS environment variables, viewport-fit=cover usage
- [Tailwind CSS v4 Custom Colors](https://tailwindcss.com/docs/customizing-colors) -- color-mix() based opacity modifiers, `--color-*` namespace behavior

### Tertiary (LOW confidence)

- [Mobile App UI/UX Design Trends 2026](https://spdload.com/blog/mobile-app-ui-ux-design-trends/) -- voice-first patterns, minimal chrome, gesture navigation (general design guidance, not implementation-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new libraries needed, all tools already in project
- Architecture: HIGH -- Composing existing hooks with new UI components, well-understood patterns
- Pitfalls: HIGH -- AudioContext autoplay policy and dvh well-documented; connect/start race condition identified from reading actual hook code
- Theme system: HIGH -- Verified against official Tailwind v4 docs, project already uses @theme correctly

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (stable tech, no fast-moving dependencies)
