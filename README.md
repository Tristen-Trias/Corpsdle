# DISCLAIMER

Yes, this code is very heavily extremely absolutely vibe coded. I thought it would be a neat
project to get some insight how to set up and deploy something through cloudflare and github pages. I 
am a full time software engineer, so I *somewhat* know what I'm doing

I do not condone generative AI for any creative use within DCI. 

# Corpsdle - a daily DCI show guessing game

A Wordle-style daily guessing game! Guess today's Drum Corps International Finals program by
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
  score, and Finals placement.
  - Show data from 2008 to 2025 
  - Up to the top 25 scores from both Open class and World class
  - Anything before 2010 is World class/Div I only
- The day's answer is picked deterministically from that pool based on the current date,
  so everyone sees the same puzzle on a given day, and it rotates at midnight local time.
- Guesses must match a title in the pool exactly (an autocomplete dropdown helps with
  that) - six tries, like the games this is patterned after.
- `src/app/services/game.ts` has all the game logic (loading data, picking the answer,
  scoring guesses). `src/app/app.ts` / `app.html` / `app.css` render it.

## Stack

Angular 22 with Typescript

Hosted with Github Pages

Domain name through Cloudflare
