# Wellness App - Premium Character System

Dette er en eksklusiv e-helse plattform med et premium karakter-basert LLM-system, designet for en intens og engasjerende brukeropplevelse.

## 🌟 Funksjoner

- **Karakter-basert LLM**: Velg mellom unike personas som **Thea**, **Mari**, og **Milfen**.
- **Norwegian Native**: Hele systemet, inkludert prompts, guardrails og UI, er utviklet for det norske markedet.
- **Premium Estetikk**: Et mørkt, luksuriøst design ("Premium Fetish") med dype farger, gull-detaljer og responsive animasjoner.
- **Sanntidskommunikasjon**: Bruker WebSockets for sømløs integrasjon mellom LLM og TTS (Text-to-Speech).
- **Egendefinert sesjonsflyt**: Brukeren kan selv velge stemning, varighet og bakgrunnslyder som **Regn**, **Hav** eller **Atmosfære**.

## 🚀 Teknisk Stakk

- **Framework**: Next.js 15+ (App Router, Turbopack)
- **Styling**: Tailwind CSS med custom design tokens
- **Database**: PostgreSQL med Drizzle ORM
- **Sanntid**: WebSockets (`next-ws`)
- **AI/LLM**: OpenAI GPT-4 basert pipeline med custom jailbreak-logikk og guardrails
- **TTS**: ElevenLabs API for high-fidelity tale

## 🛠 Oppsett

1.  **Installer avhengigheter**:
    ```bash
    npm install
    ```

2.  **Miljøvariabler**:
    Opprett en `.env` fil med følgende:
    ```env
    LLM_API_KEY=your_key
    DATABASE_URL=your_db_url
    LLM_API_URL=https://api.openai.com/v1
    ```

3.  **Kjør utviklingsserver**:
    ```bash
    npm run dev
    ```

## 🎨 Designfilosofi

Applikasjonen følger en "Premium Fetish"-estetikk med fokus på:
- **Kontrast**: Elektrisk lilla og blodrødt mot dyp sort.
- **Interaksjon**: Mikropulsing og smidige overganger på alle interaktive elementer.
- **Konsistens**: Alle valgknapper (mood, length, soundscape) følger det samme grid-baserte designet for en balansert layout.

---
© 2026 Wellness App Team - Utviklet for moderne nytelse og velvære.
