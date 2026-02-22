"use client";

/**
 * Client-side hook for accessing UI translations.
 *
 * Reads the current language from localStorage (key: 'lang').
 * Falls back to 'no' (Norwegian) if not set.
 *
 * Usage:
 *   const { t, lang, setLang } = useTranslation();
 *   <button>{t.logIn}</button>
 */

import { useState, useCallback } from "react";
import type { Lang } from "@/lib/llm/prompts";
import { getTranslations, type Translations } from "./translations";

const STORAGE_KEY = "lang";
const SUPPORTED_LANGS: Lang[] = ["no", "en", "sv"];

function getStoredLang(): Lang {
  if (typeof window === "undefined") return "no";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGS.includes(stored as Lang)) {
    return stored as Lang;
  }
  return "no";
}

export interface UseTranslationReturn {
  t: Translations;
  lang: Lang;
  setLang: (lang: Lang) => void;
  supportedLangs: Lang[];
}

export function useTranslation(): UseTranslationReturn {
  const [lang, setLangState] = useState<Lang>(getStoredLang);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newLang);
    }
  }, []);

  return {
    t: getTranslations(lang),
    lang,
    setLang,
    supportedLangs: SUPPORTED_LANGS,
  };
}
