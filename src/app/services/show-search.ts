import { Show } from '../models/show';

export function matchSuggestions(query: string, candidates: Show[]): Show[] {
  if (query === ' ') {
    return candidates.filter((s) => s.title.trim().length === 0).sort((a, b) => a.year - b.year);
  }

  const q = query.trim().toLowerCase();
  if (!q) return [];
  const startsWith = candidates
    .filter((s) => s.title.toLowerCase().startsWith(q))
    .sort((a, b) => a.year - b.year);
  if (startsWith.length > 0) return startsWith.slice(0, 6);

  return candidates
    .filter((s) => s.title.toLowerCase().includes(q))
    .sort((a, b) => a.year - b.year)
    .slice(0, 6);
}

export function findShowByGuess(shows: Show[], title: string): Show | undefined {
  const isBlankGuess = title.length > 0 && title.trim().length === 0;
  return isBlankGuess
    ? shows.find((s) => s.title === title)
    : shows.find((s) => s.title.toLowerCase() === title.trim().toLowerCase());
}
