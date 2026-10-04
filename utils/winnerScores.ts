import { parseOptionalNonNegativeInt } from '@/utils/matchMetadata';

export type WinnerScoreDraft = {
  playerId: number;
  playerName: string;
  raw: string;
};

export type WinnerScoreValue = {
  playerId: number;
  score: number | null;
};

export function parseHumanWinnerScores(
  drafts: WinnerScoreDraft[],
): { ok: true; values: WinnerScoreValue[] } | { ok: false; error: string } {
  const values: WinnerScoreValue[] = [];
  for (const draft of drafts) {
    const parsed = parseOptionalNonNegativeInt(draft.raw);
    if (!parsed.ok) {
      return parsed;
    }
    values.push({ playerId: draft.playerId, score: parsed.value });
  }

  const anyFilled = values.some((value) => value.score != null);
  const anyBlank = values.some((value) => value.score == null);
  if (anyFilled && anyBlank) {
    return {
      ok: false,
      error: 'Enter a score for every winning player, or leave all blank.',
    };
  }

  return { ok: true, values };
}

export function formatWinnerScoresLabel(
  entries: { playerName: string; score: number | null }[],
): string | null {
  const parts = entries
    .filter((entry) => entry.score != null)
    .map((entry) => `${entry.playerName} ${entry.score}`);
  return parts.length === 0 ? null : parts.join(' · ');
}
