"use client";

import { useActionState, useCallback, useEffect, useState, startTransition } from "react";
import { recordSensoryConsent } from "@/actions/consent";
import { BreathingOrb } from "@/components/session/breathing-orb";
import { MoodSelector } from "@/components/session/mood-selector";
import { VoicePicker } from "@/components/session/voice-picker";
import { SOUNDSCAPE_OPTIONS } from "@/hooks/use-ambient-audio";
import { DEFAULT_VOICE_ID } from "@/lib/tts/voice-options";

import { CharacterSelector } from "@/components/session/character-selector";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreSessionFlowProps {
  onBegin: (options: {
    character: "Thea" | "Mari" | "Milfen";
    sessionLength: number;
    sensoryConsent: boolean;
    mood: string;
    voiceId: string;
    soundscape: string;
  }) => void;
}

type Step = "character" | "mood" | "voice" | "length" | "consent";

const LENGTH_OPTIONS = [10, 15, 20, 30] as const;

// ---------------------------------------------------------------------------
// PreSessionFlow
// ---------------------------------------------------------------------------

export function PreSessionFlow({ onBegin }: PreSessionFlowProps) {
  const [step, setStep] = useState<Step>("character");
  const [selectedCharacter, setSelectedCharacter] = useState<"Thea" | "Mari" | "Milfen">("Thea");
  const [selectedLength, setSelectedLength] = useState(15);
  const [selectedMood, setSelectedMood] = useState("selvsikker");
  const [selectedVoiceId, setSelectedVoiceId] = useState(DEFAULT_VOICE_ID);
  const [selectedSoundscape, setSelectedSoundscape] = useState("silence");

  const commonBgClass = "relative flex min-h-dvh flex-col items-center justify-center bg-[url('/bg.png')] bg-cover bg-center px-4 safe-area-padding";
  const overlayClass = "absolute inset-0 bg-white/60 backdrop-blur-[2px]";
  const containerClass = "relative z-10 flex w-full max-w-sm flex-col items-center gap-8";

  const textTitleClass = "text-xl font-bold text-gray-900";
  const textSubclass = "mt-1 text-sm text-gray-600";
  const pinkButtonClass = "w-full max-w-xs rounded-xl bg-gradient-to-r from-pink-300 to-rose-400 py-3.5 font-bold text-rose-950 shadow-lg transition-all hover:scale-[1.02] hover:shadow-pink-200/50 active:scale-[0.98]";

  // Server action for sensory consent audit trail
  const [consentState, consentAction, isConsentPending] = useActionState(
    recordSensoryConsent,
    null
  );

  const handleSkipSensory = useCallback(() => {
    onBegin({
      character: selectedCharacter,
      sessionLength: selectedLength,
      sensoryConsent: false,
      mood: selectedMood,
      voiceId: selectedVoiceId,
      soundscape: selectedSoundscape,
    });
  }, [onBegin, selectedCharacter, selectedLength, selectedMood, selectedVoiceId, selectedSoundscape]);

  // -------------------------------------------------------------------
  // Step 0: Character Selection
  // -------------------------------------------------------------------

  if (step === "character") {
    return (
      <div className={commonBgClass}>
        <div className={overlayClass} />
        <div className={containerClass}>
          <div className="text-center">
            <h2 className={textTitleClass}>
              Velg dama di
            </h2>
            <p className={textSubclass}>
              Hvem skal eie deg i kveld?
            </p>
          </div>

          <CharacterSelector selected={selectedCharacter} onSelect={setSelectedCharacter} />

          <button
            onClick={() => setStep("mood")}
            className={pinkButtonClass}
          >
            Velg henne
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Step 1: Mood Selection
  // -------------------------------------------------------------------

  if (step === "mood") {
    return (
      <div className={commonBgClass}>
        <div className={overlayClass} />
        <div className={containerClass}>
          <div className="text-center">
            <h2 className={textTitleClass}>
              Hvilket humør er hun i?
            </h2>
            <p className={textSubclass}>
              Dette setter stemningen for rushet
            </p>
          </div>

          <MoodSelector selected={selectedMood} onSelect={setSelectedMood} />

          <button
            onClick={() => setStep("voice")}
            className={pinkButtonClass}
          >
            Fortsett
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Step 2: Voice Selection
  // -------------------------------------------------------------------

  if (step === "voice") {
    return (
      <div className={commonBgClass}>
        <div className={overlayClass} />
        <div className={containerClass}>
          <div className="text-center">
            <h2 className={textTitleClass}>
              Velg stemmen hennes
            </h2>
            <p className={textSubclass}>
              Hvordan vil du at hun skal snakke til deg?
            </p>
          </div>

          <VoicePicker selected={selectedVoiceId} onSelect={setSelectedVoiceId} />

          <button
            onClick={() => setStep("length")}
            className={pinkButtonClass}
          >
            Fortsett
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Step 3: Length + Soundscape Selection
  // -------------------------------------------------------------------

  if (step === "length") {
    return (
      <div className={commonBgClass}>
        <div className={overlayClass} />
        <div className={containerClass}>
          <div className="text-center">
            <h2 className={textTitleClass}>
              Hvor lenge skal det vare?
            </h2>
            <p className={textSubclass}>
              Velg lengden på rushet
            </p>
          </div>

          {/* 2x2 grid of duration options */}
          <div className="grid w-full grid-cols-2 gap-3">
            {LENGTH_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                onClick={() => setSelectedLength(minutes)}
                className={`flex items-center justify-center min-h-[56px] rounded-xl text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${selectedLength === minutes
                  ? "bg-gradient-to-r from-pink-300 to-rose-400 text-rose-950 shadow-md"
                  : "bg-gradient-to-br from-white/90 to-white/60 text-gray-700 border border-pink-100"
                  }`}
              >
                {minutes} min
              </button>
            ))}
          </div>

          {/* Soundscape selector */}
          <div className="w-full">
            <p className="mb-3 text-center text-sm font-medium text-gray-600">
              Bakgrunnslyd
            </p>
            <div className="grid w-full grid-cols-3 gap-2">
              {SOUNDSCAPE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedSoundscape(option.id)}
                  className={`flex h-10 items-center justify-center rounded-xl border text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${selectedSoundscape === option.id
                    ? "border-rose bg-gradient-to-r from-pink-200 to-pink-300 text-rose-900"
                    : "border-pink-100 bg-white/70 text-gray-500"
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep("consent")}
            className={pinkButtonClass}
          >
            Fortsett
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Step 4: Conversational Consent
  // -------------------------------------------------------------------

  return (
    <div className={commonBgClass}>
      <div className={overlayClass} />
      <div className={containerClass}>
        <div className="space-y-4 text-center">
          <p className="text-sm leading-relaxed font-medium text-gray-700">
            Før vi starter &mdash; jeg er en AI-guide designet for å eie lysten din.
            Dette er rollespill for voksne, en flukt fra virkeligheten.
          </p>
          <p className="text-sm leading-relaxed font-medium text-gray-700">
            Denne sesjonen inneholder grov tale, detaljerte kroppsbeskrivelser og
            temaer rundt intens nytelse og ekstase. Er du klar for å gi slipp?
          </p>
        </div>

        {/* Error from consent action */}
        {(consentState as { error?: string })?.error && (
          <div className="w-full rounded-lg bg-rose/10 p-3 text-center text-sm text-rose-900 border border-rose-200">
            {(consentState as { error?: string }).error}
          </div>
        )}

        <div className="flex w-full flex-col items-center gap-3">
          {/* Primary: consent + begin */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              startTransition(() => {
                consentAction(formData);
              });
              onBegin({
                character: selectedCharacter,
                sessionLength: selectedLength,
                sensoryConsent: true,
                mood: selectedMood,
                voiceId: selectedVoiceId,
                soundscape: selectedSoundscape,
              });
            }}
            className="w-full max-w-xs"
          >
            <input type="hidden" name="consent" value="true" />
            <button
              type="submit"
              disabled={isConsentPending}
              className={pinkButtonClass}
            >
              {isConsentPending ? "Starter..." : "Jeg er klar. Eier meg."}
            </button>
          </form>

          {/* Secondary: skip sensory content */}
          <button
            type="button"
            onClick={handleSkipSensory}
            className="text-sm font-bold text-gray-500 transition-colors hover:text-gray-700 underline underline-offset-4"
          >
            Hopp over introduksjon
          </button>
        </div>
      </div>
    </div>
  );
}
