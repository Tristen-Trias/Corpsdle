# Corpsdle - a daily DCI show guessing game

A Wordle-style daily guessing game built in Angular 22 (standalone components, signals,
new `@if`/`@for` control flow). Guess today's Drum Corps International Finals program by
**title**. Each guess reveals how close you were on **Corps**, **Year**, **Score**, and
**Placement**, with directional arrows pointing toward the true answer.

## Run it

```bash
npm install
npm start
```

Then open http://localhost:4200.

## How it works

- `public/data/shows.json` holds the pool of shows the game draws from: corps, year,
  score, and Finals placement. This is the file you'd swap out or grow to add more shows.
- The day's answer is picked deterministically from that pool based on the current date,
  so everyone sees the same puzzle on a given day, and it rotates at midnight local time.
- Guesses must match a title in the pool exactly (an autocomplete dropdown helps with
  that) - six tries, like the games this is patterned after.
- `src/app/services/game.ts` has all the game logic (loading data, picking the answer,
  scoring guesses). `src/app/app.ts` / `app.html` / `app.css` render it.

## Notes on the data

The sample data in `shows-2025.json` draws on real DCI World Class Finals results.

Yes, this code is very heavily extremely absolutely vibe coded. I do not condone generative AI for any creative use within DCI.
