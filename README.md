# ⛳ Crack Cash

A mobile-first PWA for tracking money bets between friends during a round of golf. Supports three simultaneous games: **Crack** (point scoring), **Greenies** (par-3 side bet), and **Poker Chips**.

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Building for Production

```bash
npm run build
```

Static files are output to `dist/`. Deploy to Vercel, Netlify, GitHub Pages, or any static host.

## Deploying

### Vercel (recommended)
```bash
npm i -g vercel
vercel
```

### Netlify
Drag the `dist/` folder into [app.netlify.com/drop](https://app.netlify.com/drop).

### GitHub Pages
Push to a repo and enable GitHub Pages pointing at the `dist/` branch or use the `gh-pages` package.

## Generating PWA Icons (required for home screen install)

The PWA needs PNG icon files. Generate them from the SVG source:

```bash
npm install --save-dev @napi-rs/canvas
node scripts/generate-icons.js
```

This creates `public/icons/apple-touch-icon.png`, `icon-192.png`, and `icon-512.png`.

Alternatively, open `public/icon.svg` in any browser or design tool, export it as PNG at 192×192 and 512×512, and save to `public/icons/`.

## Adding to iPhone Home Screen

1. Open the deployed URL in **Safari** on iPhone or iPad.
2. Tap the **Share** button (rectangle with an arrow pointing up).
3. Scroll down and tap **"Add to Home Screen"**.
4. Name it **Crack Cash** and tap **Add**.

The app will open full-screen with no browser chrome, just like a native app.

## Game Rules Summary

### Crack (Point Scoring)

| Par | Points | Categories |
|-----|--------|-----------|
| 3   | 3      | Closest to pin (on green), Individual low score, Low team score |
| 4/5 | 4      | Longest drive (fairway), GIR, Individual low score, Low team score |

Each point = **$0.50** by default (configurable).

**Cracking** (2-team games only): The trailing team may call "Crack" after the other team tees off → point value ×2. The other team may "Re-crack" → ×3. Original cracking team may "Re-crack 2" → ×4.

### Greenies (Par 3 Side Bet)

On par 3s where at least one player hits the green:
- **Par or better** → closest-to-pin player collects **$5** from each other player
- **Bogey or worse** → closest-to-pin player pays **$10** to each other player

### Poker Chips

- One chip per 9 holes (front & back)
- Earned by making a putt longer than the flagstick — can be stolen
- Chip holder at end of the 9 collects **$5 from each other player**

## Data Persistence

All round data is saved to `localStorage` automatically. Closing the app and reopening will restore your in-progress round. Use "Start New Round" on the settlement screen to clear it.
