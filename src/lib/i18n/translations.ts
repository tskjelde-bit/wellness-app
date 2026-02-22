/**
 * UI translations for all user-facing strings.
 * Supports: 'no' (Norwegian), 'en' (English), 'sv' (Swedish).
 */

import type { Lang } from "@/lib/llm/prompts";

export interface Translations {
  // Auth
  signIn: string;
  register: string;
  logIn: string;
  loggingIn: string;
  createAccount: string;
  creating: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  name: string;
  namePlaceholder: string;
  noAccount: string;
  alreadyHaveAccount: string;

  // Home
  homeTitle: string;
  homeSubtitle: string;

  // Dashboard
  dashboard: string;
  welcome: string;
  startNewSession: string;
  logOut: string;

  // Age gate
  verifyAge: string;
  ageDescription: string;
  dateOfBirth: string;
  confirmAge: string;
  verifying: string;

  // Terms
  termsTitle: string;
  termsDescription: string;
  readTerms: string;
  readPrivacy: string;
  acceptTerms: string;
  acceptPrivacy: string;
  acceptAndContinue: string;
  processing: string;

  // Subscribe
  unlockTitle: string;
  unlockSubtitle: string;
  fullAccess: string;
  monthlyPlan: string;
  unlimitedSessions: string;
  feature1: string;
  feature2: string;
  feature3: string;
  subscribeNow: string;
  securePayment: string;

  // Pre-session flow
  chooseCharacter: string;
  chooseCharacterSub: string;
  chooseHer: string;
  chooseMood: string;
  chooseMoodSub: string;
  chooseVoice: string;
  chooseVoiceSub: string;
  chooseLength: string;
  chooseLengthSub: string;
  backgroundSound: string;
  continueBtn: string;
  consentText1: string;
  consentText2: string;
  startBtn: string;
  starting: string;
  skipIntro: string;

  // Session
  connecting: string;
  endSession: string;
  voiceLabel: string;
  ambientLabel: string;

  // Post-session
  sessionComplete: string;
  backToDashboard: string;

  // Soundscapes
  soundRain: string;
  soundOcean: string;
  soundForest: string;
  soundAmbient: string;
  soundSilence: string;
}

export const TRANSLATIONS: Record<Lang, Translations> = {
  no: {
    signIn: "Logg inn",
    register: "Registrer deg",
    logIn: "Logg inn",
    loggingIn: "Logger inn...",
    createAccount: "Opprett konto",
    creating: "Oppretter...",
    email: "E-post",
    emailPlaceholder: "din@epost.no",
    password: "Passord",
    passwordPlaceholder: "Ditt passord",
    name: "Navn",
    namePlaceholder: "Ditt navn",
    noAccount: "Har du ikke bruker? Registrer deg her",
    alreadyHaveAccount: "Har du allerede konto? Logg inn",

    homeTitle: "Wellness & Sensory Connection Assistant",
    homeSubtitle: "A voice-guided wellness experience for calm, presence, and connection.",

    dashboard: "Dashboard",
    welcome: "Velkommen",
    startNewSession: "Start ny sesjon",
    logOut: "Logg ut",

    verifyAge: "Verifiser alder",
    ageDescription: "For din sikkerhet og for å følge loven, må vi bekrefte at du er 18 år eller eldre.",
    dateOfBirth: "Fødselsdato",
    confirmAge: "Bekreft alder",
    verifying: "Verifiserer...",

    termsTitle: "Vilkår & Personvern",
    termsDescription: "Vennligst gå gjennom og godta våre vilkår og personvernerklæring før du fortsetter.",
    readTerms: "Les brukervilkårene",
    readPrivacy: "Les personvernerklæringen",
    acceptTerms: "Jeg godtar brukervilkårene",
    acceptPrivacy: "Jeg godtar personvernerklæringen",
    acceptAndContinue: "Godta & Fortsett",
    processing: "Behandler...",

    unlockTitle: "Lås opp din wellness-reise",
    unlockSubtitle: "Opplev personlig, stemmestyrt avslapning skreddersydd for deg. La deg bli holdt i et rom av ro, tilstedeværelse og nytelse.",
    fullAccess: "Full tilgang",
    monthlyPlan: "Månedlig abonnement",
    unlimitedSessions: "Ubegrensede sesjoner",
    feature1: "Personlig AI-veiledet avslapning",
    feature2: "Adaptive sesjoner",
    feature3: "Sikkert, privat rom",
    subscribeNow: "Abonner nå",
    securePayment: "Sikker betaling via CCBill. Avbryt når som helst.",

    chooseCharacter: "Velg dama di",
    chooseCharacterSub: "Hvem skal eie deg i kveld?",
    chooseHer: "Velg henne",
    chooseMood: "Hvilket humør er hun i?",
    chooseMoodSub: "Dette setter stemningen for rushet",
    chooseVoice: "Velg stemmen hennes",
    chooseVoiceSub: "Hvordan vil du at hun skal snakke til deg?",
    chooseLength: "Hvor lenge skal det vare?",
    chooseLengthSub: "Velg lengden på rushet",
    backgroundSound: "Bakgrunnslyd",
    continueBtn: "Fortsett",
    consentText1: "Før vi starter — jeg er en AI-guide designet for å eie lysten din. Dette er rollespill for voksne, en flukt fra virkeligheten.",
    consentText2: "Denne sesjonen inneholder grov tale, detaljerte kroppsbeskrivelser og temaer rundt intens nytelse og ekstase. Er du klar for å gi slipp?",
    startBtn: "Jeg er klar. Eier meg.",
    starting: "Starter...",
    skipIntro: "Hopp over introduksjon",

    connecting: "Kobler til...",
    endSession: "Avslutt sesjon",
    voiceLabel: "Stemme",
    ambientLabel: "Bakgrunn",

    sessionComplete: "Sesjonen er ferdig",
    backToDashboard: "Gå tilbake til oversikten",

    soundRain: "Regn",
    soundOcean: "Hav",
    soundForest: "Skog",
    soundAmbient: "Atmosfære",
    soundSilence: "Stillhet",
  },

  en: {
    signIn: "Sign In",
    register: "Register",
    logIn: "Log in",
    loggingIn: "Logging in...",
    createAccount: "Create Account",
    creating: "Creating...",
    email: "Email",
    emailPlaceholder: "your@email.com",
    password: "Password",
    passwordPlaceholder: "Your password",
    name: "Name",
    namePlaceholder: "Your name",
    noAccount: "Don't have an account? Register here",
    alreadyHaveAccount: "Already have an account? Sign in",

    homeTitle: "Wellness & Sensory Connection Assistant",
    homeSubtitle: "A voice-guided wellness experience for calm, presence, and connection.",

    dashboard: "Dashboard",
    welcome: "Welcome",
    startNewSession: "Start new session",
    logOut: "Log out",

    verifyAge: "Verify Age",
    ageDescription: "For your safety and legal compliance, we must confirm you are 18 or older.",
    dateOfBirth: "Date of Birth",
    confirmAge: "Confirm Age",
    verifying: "Verifying...",

    termsTitle: "Terms & Privacy",
    termsDescription: "Please review and accept our terms and privacy policy before continuing.",
    readTerms: "Read Terms of Service",
    readPrivacy: "Read Privacy Policy",
    acceptTerms: "I accept the terms of service",
    acceptPrivacy: "I accept the privacy policy",
    acceptAndContinue: "Accept & Continue",
    processing: "Processing...",

    unlockTitle: "Unlock Your Wellness Journey",
    unlockSubtitle: "Experience personalized, voice-guided relaxation tailored for you. Let yourself be held in a space of calm, presence, and pleasure.",
    fullAccess: "Full Access",
    monthlyPlan: "Monthly Subscription",
    unlimitedSessions: "Unlimited Sessions",
    feature1: "Personalized AI-guided Relaxation",
    feature2: "Adaptive Sessions",
    feature3: "Safe, Private Space",
    subscribeNow: "Subscribe Now",
    securePayment: "Secure payment via CCBill. Cancel anytime.",

    chooseCharacter: "Choose your lady",
    chooseCharacterSub: "Who's owning you tonight?",
    chooseHer: "Choose her",
    chooseMood: "What mood is she in?",
    chooseMoodSub: "This sets the mood for the rush",
    chooseVoice: "Choose her voice",
    chooseVoiceSub: "How do you want her to talk to you?",
    chooseLength: "How long should it last?",
    chooseLengthSub: "Choose the length of the rush",
    backgroundSound: "Background Sound",
    continueBtn: "Continue",
    consentText1: "Before we start — I am an AI guide designed to own your desire. This is adult roleplay, an escape from reality.",
    consentText2: "This session contains rough language, detailed body descriptions, and themes of intense pleasure and ecstasy. Are you ready to let go?",
    startBtn: "I'm ready. Own me.",
    starting: "Starting...",
    skipIntro: "Skip introduction",

    connecting: "Connecting...",
    endSession: "End session",
    voiceLabel: "Voice",
    ambientLabel: "Background",

    sessionComplete: "Session complete",
    backToDashboard: "Go back to dashboard",

    soundRain: "Rain",
    soundOcean: "Ocean",
    soundForest: "Forest",
    soundAmbient: "Atmosphere",
    soundSilence: "Silence",
  },

  sv: {
    signIn: "Logga in",
    register: "Registrera dig",
    logIn: "Logga in",
    loggingIn: "Loggar in...",
    createAccount: "Skapa konto",
    creating: "Skapar...",
    email: "E-post",
    emailPlaceholder: "din@epost.se",
    password: "Lösenord",
    passwordPlaceholder: "Ditt lösenord",
    name: "Namn",
    namePlaceholder: "Ditt namn",
    noAccount: "Har du inget konto? Registrera dig här",
    alreadyHaveAccount: "Har du redan ett konto? Logga in",

    homeTitle: "Wellness & Sensory Connection Assistant",
    homeSubtitle: "En röststyrd wellnessupplevelse för lugn, närvaro och kontakt.",

    dashboard: "Dashboard",
    welcome: "Välkommen",
    startNewSession: "Starta ny session",
    logOut: "Logga ut",

    verifyAge: "Verifiera ålder",
    ageDescription: "För din säkerhet och för att följa lagen måste vi bekräfta att du är 18 år eller äldre.",
    dateOfBirth: "Födelsedatum",
    confirmAge: "Bekräfta ålder",
    verifying: "Verifierar...",

    termsTitle: "Villkor & Integritet",
    termsDescription: "Vänligen gå igenom och acceptera våra villkor och integritetspolicy innan du fortsätter.",
    readTerms: "Läs användarvillkoren",
    readPrivacy: "Läs integritetspolicyn",
    acceptTerms: "Jag accepterar användarvillkoren",
    acceptPrivacy: "Jag accepterar integritetspolicyn",
    acceptAndContinue: "Acceptera & Fortsätt",
    processing: "Bearbetar...",

    unlockTitle: "Lås upp din wellness-resa",
    unlockSubtitle: "Upplev personlig, röststyrd avslappning skräddarsydd för dig. Låt dig hållas i ett rum av lugn, närvaro och njutning.",
    fullAccess: "Full tillgång",
    monthlyPlan: "Månadsabonnemang",
    unlimitedSessions: "Obegränsade sessioner",
    feature1: "Personlig AI-guidad avslappning",
    feature2: "Adaptiva sessioner",
    feature3: "Säkert, privat rum",
    subscribeNow: "Prenumerera nu",
    securePayment: "Säker betalning via CCBill. Avsluta när som helst.",

    chooseCharacter: "Välj din dam",
    chooseCharacterSub: "Vem äger dig ikväll?",
    chooseHer: "Välj henne",
    chooseMood: "Vilket humör är hon i?",
    chooseMoodSub: "Detta sätter stämningen för rusen",
    chooseVoice: "Välj hennes röst",
    chooseVoiceSub: "Hur vill du att hon ska tala till dig?",
    chooseLength: "Hur länge ska det vara?",
    chooseLengthSub: "Välj längden på rusen",
    backgroundSound: "Bakgrundsljud",
    continueBtn: "Fortsätt",
    consentText1: "Innan vi börjar — jag är en AI-guide designad för att äga din lust. Detta är rollspel för vuxna, en flykt från verkligheten.",
    consentText2: "Denna session innehåller grovt språk, detaljerade kroppsbeskrivningar och teman kring intensiv njutning och extas. Är du redo att släppa taget?",
    startBtn: "Jag är redo. Äg mig.",
    starting: "Startar...",
    skipIntro: "Hoppa över introduktionen",

    connecting: "Ansluter...",
    endSession: "Avsluta session",
    voiceLabel: "Röst",
    ambientLabel: "Bakgrund",

    sessionComplete: "Sessionen är klar",
    backToDashboard: "Gå tillbaka till översikten",

    soundRain: "Regn",
    soundOcean: "Hav",
    soundForest: "Skog",
    soundAmbient: "Atmosfär",
    soundSilence: "Tystnad",
  },
};

/** Get translations for the given language */
export function getTranslations(lang: Lang = 'no'): Translations {
  return TRANSLATIONS[lang];
}
