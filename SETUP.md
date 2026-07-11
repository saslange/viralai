# Setup — heysash85 viral lab

Instagram-Content- und Hook-Analyse-Tool: Accounts manuell hinzufügen, Postings
per Swipe bewerten (rechts = behalten, links = verwerfen, hoch = merken),
Trends erkennen. Single-User-Login für `sash@heysash.de`.

## 1. Supabase-Projekt anlegen

1. Auf [supabase.com](https://supabase.com) ein neues Projekt erstellen (Free-Tier reicht).
2. Unter **SQL Editor** den Inhalt von `supabase/migrations/0001_init.sql` ausführen.
3. Unter **Authentication → Providers** sicherstellen, dass "Email" aktiv ist,
   unter **Authentication → Email Templates** ggf. den Magic-Link-Text anpassen.
4. Unter **Authentication → URL Configuration** die spätere Vercel-URL (und
   `http://localhost:3000` für lokale Tests) als Redirect-URL eintragen
   (`https://DEINE-DOMAIN/auth/callback`).
5. Unter **Project Settings → API** die Werte für `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` und `SUPABASE_SERVICE_ROLE_KEY` (unter
   "service_role", geheim halten!) kopieren.

## 2. ScrapeCreators-Account

1. Auf [scrapecreators.com](https://scrapecreators.com) registrieren, API-Key
   generieren → `SCRAPECREATORS_API_KEY`.
2. **Wichtig:** Die Feld-Zuordnung in `src/lib/scrapecreators.ts` basiert auf der
   üblichen Instagram-Post-Struktur, ist aber ohne Live-Zugang nicht final
   verifiziert. Nach dem ersten Sync (`GET /api/sync` mit Bearer-Token) prüfen,
   ob Bilder/Zahlen korrekt ankommen. Falls nicht: eine Beispiel-Response aus
   den ScrapeCreators-Logs schicken, dann passen wir die Zuordnung in dieser
   einen Datei an.

## 3. Anthropic API Key

Auf [console.anthropic.com](https://console.anthropic.com/settings/keys) einen
Key erzeugen → `ANTHROPIC_API_KEY`. Wird nur für die Hook-Kategorisierung auf
der Trends-Seite gebraucht, Kosten bei diesem Volumen minimal (Cent-Bereich).

## 4. Lokal starten

```bash
cp .env.example .env.local
# Werte eintragen
npm run dev
```

## 5. Deploy auf Vercel

1. Repo in Vercel importieren (Framework wird automatisch als Next.js erkannt).
2. Alle Variablen aus `.env.example` unter **Project Settings → Environment
   Variables** eintragen. `CRON_SECRET` selbst frei erfinden (z. B. per
   `openssl rand -hex 32`) — Vercel hängt ihn dann automatisch als
   `Authorization: Bearer <CRON_SECRET>` an den Cron-Aufruf.
3. Der Cron-Job (`vercel.json`) synchronisiert täglich um 06:00 UTC alle
   aktiven Accounts. Frequenz lässt sich in `vercel.json` anpassen (Vercel
   Hobby-Plan: max. 1×/Tag pro Cron auf dem kostenlosen Plan, für häufigere
   Syncs braucht es den Pro-Plan ab $20/Monat).
4. Optional: eigene Subdomain unter `heysash.de` (z. B. `viral.heysash.de`)
   als Custom Domain in Vercel eintragen und den CNAME beim DNS-Anbieter von
   heysash.de setzen — danach in Supabase die Redirect-URL entsprechend
   anpassen.

## Laufende Kosten (Schätzung bei ~15-20 beobachteten Accounts, täglicher Sync)

| Dienst | Plan | Kosten/Monat |
|---|---|---|
| Vercel | Hobby | $0 |
| Supabase | Free | $0 |
| ScrapeCreators | Pay-as-you-go | ~$5–20 |
| Anthropic API | Pay-as-you-go | < $1 |
| **Gesamt** | | **~$5–20/Monat** |

Sobald mehr Accounts/häufigerer Sync gebraucht werden, zuerst an
ScrapeCreators-Volumen denken — das skaliert am direktesten mit den Kosten.
