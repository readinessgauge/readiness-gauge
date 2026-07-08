# Readiness Gauge — AI Readiness Diagnostic

A one-question-at-a-time diagnostic that scores an organisation's AI readiness
across 5 categories, with a results dashboard and progress tracking over
repeated assessments. Gated behind a magic-link login (Supabase Auth) so the
tool can't just be shared as an open link.

## One-time setup: Supabase (free)

1. Go to supabase.com → sign up → "New Project"
2. Once created, go to **Authentication → Providers** and make sure **Email**
   is enabled. Under **Authentication → URL Configuration**, add your site
   URL (e.g. `https://readinessgauge.com`) as an allowed redirect URL.
3. Go to **Project Settings → API**. Copy the **Project URL** and the
   **anon public** key.
4. Copy `.env.example` to `.env` and paste those two values in.
5. When you deploy to Vercel, add the same two values under
   **Project Settings → Environment Variables** (same names, `VITE_SUPABASE_URL`
   and `VITE_SUPABASE_ANON_KEY`).

That's it — no database tables to create. Supabase handles the login/signup
flow entirely; this app only uses it to gate access.

## Mailing list / marketing consent

The login screen includes an optional, unchecked-by-default checkbox: "Yes,
send me occasional updates on AI readiness." This is stored on the user's
account in Supabase (not a separate marketing tool), so you're only ever
emailing people who explicitly opted in — separate from just being able to
log in.

**To view or export consented emails:**
1. Supabase dashboard → **Authentication → Users**
2. Click into a user to see their metadata, which includes
   `marketing_consent: true/false` and the date they consented
3. There's no one-click "export only consented users" button in the Supabase
   UI, so for now you'd check each user's metadata, or (once you have more
   signups than is practical to check by hand) run a short SQL query in
   Supabase's **SQL Editor** to pull just the consented emails — ask me for
   this query whenever you're ready to send your first email

**Known limitation:** this consent flag is captured at the moment someone
first signs up. If an existing user logs in again later and the checkbox
state differs, it won't retroactively update their stored preference. For a
v1 this is a reasonable trade-off; worth revisiting if consent status needs
to be changeable after the fact (e.g. an unsubscribe flow).

## Run locally
npm install
npm run dev

## Deploy
Push this repo to GitHub, then import it into Vercel (vercel.com) as a new
project. Vercel auto-detects Vite and deploys with zero configuration —
just remember to add the two environment variables above.

## Known limitation
Assessment results are currently saved in the browser (per device), scoped
to the logged-in user's email. That means a client who logs in from a
different device won't see their old results there yet. If that matters for
how you sell this, the next upgrade is storing results in a Supabase table
instead of the browser — worth doing once you have real customers using it
regularly.
