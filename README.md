# heysash85 · viral lab

Instagram-Content- und Hook-Analyse-Tool: beobachtete Accounts manuell
hinzufügen, neue Postings per Swipe bewerten (rechts = behalten, links =
verwerfen, hoch = merken) und erkennen, welche Hooks/Formate am besten
ankommen.

Stack: Next.js (App Router) auf Vercel, Supabase (Auth/Postgres), Instagram-
Daten über ScrapeCreators, Hook-Kategorisierung über die Anthropic API.

Setup-Anleitung (Supabase, ScrapeCreators, Anthropic, Deploy, laufende
Kosten): siehe [`SETUP.md`](./SETUP.md).

## Lokal starten

```bash
cp .env.example .env.local   # Werte eintragen, siehe SETUP.md
npm install
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).
