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

  const commonBgClass = "relative flex min-h-dvh flex-col items-center justify-center bg-white px-4 safe-area-padding";
  const containerClass = "relative z-10 flex w-full max-w-sm flex-col items-center gap-8";

  const textTitleClass = "text-xl font-extrabold text-gray-900 tracking-tight";
  const textSubclass = "mt-1 text-sm font-medium text-gray-500";
  const monochromeButtonClass = "w-full max-w-xs rounded-xl bg-gradient-to-b from-gray-800 to-gray-950 py-3.5 font-bold text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-black active:scale-[0.98]";

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
            className={monochromeButtonClass}
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
            className={monochromeButtonClass}
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
            className={monochromeButtonClass}
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
                  ? "bg-gradient-to-b from-gray-800 to-gray-950 text-white shadow-lg"
                  : "bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800 border border-gray-200"
                  }`}
              >
                {minutes} min
              </button>
            ))}
          </div>

          {/* Soundscape selector */}
          <div className="w-full">
            <p className="mb-3 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
              Bakgrunnslyd
            </p>
            <div className="grid w-full grid-cols-3 gap-2">
              {SOUNDSCAPE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedSoundscape(option.id)}
                  className={`flex h-10 items-center justify-center rounded-xl border text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${selectedSoundscape === option.id
                    ? "border-gray-800 bg-gray-800 text-white"
                    : "border-gray-200 bg-gray-50 text-gray-500"
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep("consent")}
            className={monochromeButtonClass}
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
      <div className={containerClass}>
        <div className="space-y-4 text-center">
          <p className="text-sm leading-relaxed font-bold text-gray-800">
            Før vi starter &mdash; jeg er en AI-guide designet for å eie lysten din.
            Dette er rollespill for voksne, en flukt fra virkeligheten.
          </p>
          <p className="text-sm leading-relaxed font-bold text-gray-800">
            Denne sesjonen inneholder grov tale, detaljerte kroppsbeskrivelser og
            temaer rundt intens nytelse og ekstase. Er du klar for å gi slipp?
          </p>
        </div>

        {/* Error from consent action */}
        {(consentState as { error?: string })?.error && (
          <div className="w-full rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-900 border border-gray-200">
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
              className={monochromeButtonClass}
            >
              {isConsentPending ? "Starter..." : "Jeg er klar. Eier meg."}
            </button>
          </form>

          {/* Secondary: skip sensory content */}
          <button
            type="button"
            onClick={handleSkipSensory}
            className="text-xs font-black text-gray-400 uppercase tracking-widest transition-colors hover:text-gray-900 underline underline-offset-8"
          >
            Hopp over introduksjon
          </button>
        </div>
      </div>
    </div>
  );
}
