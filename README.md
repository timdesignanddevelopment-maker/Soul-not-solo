# Soul Not Solo

Tell it what you're going through — typed or spoken — and it finds a real
Bible passage suited to your situation, reveals it with the verse growing
large out of a softly blurring open book, and lets you share it straight to
your socials. Also includes a dedication page and a full Bible reader (all
66 books, every chapter) for reading on your own.

## Structure

- `app/` — the React Native (Expo) mobile app: input screen, reveal
  animation, Bible reader, dedication/about page.
- `server/` — a small Node/Express backend with one endpoint that calls
  Claude to match a situation to a verse. This exists only to keep the
  Anthropic API key off the device; the app never talks to Claude directly.

## Prerequisite: install Node.js

**This machine doesn't have Node.js installed yet** — nothing here has been
run or verified. Install it first (LTS is fine):

```bash
winget install OpenJS.NodeJS.LTS
```

Then open a new terminal so `node`/`npm` are on PATH, and confirm:

```bash
node -v
npm -v
```

## Running the backend

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` and set `ANTHROPIC_API_KEY` to a real key (get one at
https://console.anthropic.com). Without it, verse matching silently falls
back to a small built-in keyword list instead of calling Claude.

```bash
npm run dev
```

This starts the backend on `http://localhost:4000`. Test it:

```bash
curl -X POST http://localhost:4000/api/verse \
  -H "Content-Type: application/json" \
  -d "{\"situation\":\"I just lost my job and I'm scared\"}"
```

## Running the app

Voice input (`@react-native-voice/voice`) is a native module, so the app
needs a **custom Expo dev client** rather than plain Expo Go:

```bash
cd app
npm install
npx expo install --fix   # resolves exact versions for your Expo SDK
npx expo prebuild
npx expo run:ios         # or: npx expo run:android
```

`expo run:ios` needs Xcode installed (Mac only); `expo run:android` needs
Android Studio + an emulator or a device with USB debugging on. After the
first native build, day-to-day iteration is just:

```bash
npx expo start --dev-client
```

### Pointing the app at the backend

By default the app calls `http://localhost:4000`, which only works for the
iOS Simulator/Android emulator on the same machine as the backend. For a
physical phone on the same Wi-Fi, create `app/.env`:

```
EXPO_PUBLIC_BACKEND_URL=http://<your-computer's-LAN-IP>:4000
```

(Deploying the backend somewhere public, e.g. Render or Fly.io, is a later
step once the app itself is working end-to-end.)

## What to personalize before sharing this with anyone

- **Dedication text** in [app/app/(tabs)/about.tsx](app/app/(tabs)/about.tsx)
  is filled in — edit it there directly if you ever want to revise it.
- **App icon / splash image** — none are wired up yet; Expo will use its
  default icon until you add your own via `app.json`.
- **Reveal background** — currently a warm gradient + faint page-line texture
  drawn in code (`GrowingVerseText.tsx`), not a real book photo, so there's no
  copyrighted image to worry about. If you want an actual photo of an open
  Bible behind the text, drop an image into `app/src/assets/` and swap it in
  as an `<Image>` behind the `LinearGradient` in that component.

## Feature map

| Feature | File(s) |
|---|---|
| Text/voice input | [app/app/(tabs)/index.tsx](app/app/(tabs)/index.tsx), [app/src/components/VoiceInputButton.tsx](app/src/components/VoiceInputButton.tsx) |
| AI verse matching | [server/src/claude.ts](server/src/claude.ts), [server/src/routes/verse.ts](server/src/routes/verse.ts) |
| Bible text lookup | [app/src/lib/bibleApi.ts](app/src/lib/bibleApi.ts) (bible-api.com, no key needed) |
| Growing-text reveal + blur | [app/src/components/GrowingVerseText.tsx](app/src/components/GrowingVerseText.tsx), [app/app/reveal.tsx](app/app/reveal.tsx) |
| Share to socials | [app/src/lib/shareImage.ts](app/src/lib/shareImage.ts) (native share sheet) |
| Dedication / about | [app/app/(tabs)/about.tsx](app/app/(tabs)/about.tsx) |
| Read every book/chapter | [app/app/(tabs)/read/](app/app/(tabs)/read/), [app/src/lib/bibleIndex.ts](app/src/lib/bibleIndex.ts) |
