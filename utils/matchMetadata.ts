import type { SelectOption } from '@/components/ui/SearchableSelectField';
import type { Difficulty, MapType, VictoryType } from '@/types';

export const MATCH_NONE_OPTION_ID = '__none__';

const MAP_TYPE_LABELS: Record<MapType, string> = {
  pangaea: 'Pangaea',
  continents: 'Continents',
  archipelago: 'Archipelago',
  fractal: 'Fractal',
  other: 'Other',
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  settler: 'Settler',
  chieftain: 'Chieftain',
  warlord: 'Warlord',
  prince: 'Prince',
  king: 'King',
  emperor: 'Emperor',
  immortal: 'Immortal',
  deity: 'Deity',
};

const VICTORY_TYPE_LABELS: Record<Exclude<VictoryType, 'unknown'>, string> = {
  domination: 'Domination',
  science: 'Science',
  culture: 'Culture',
  diplomatic: 'Diplomatic',
  time: 'Time',
};

function optionsFromLabels(labels: Record<string, string>): SelectOption[] {
  return [
    { id: MATCH_NONE_OPTION_ID, name: 'None' },
    ...Object.entries(labels).map(([id, name]) => ({ id, name })),
  ];
}

export const MAP_TYPE_OPTIONS = optionsFromLabels(MAP_TYPE_LABELS);
export const DIFFICULTY_OPTIONS = optionsFromLabels(DIFFICULTY_LABELS);
export const VICTORY_TYPE_OPTIONS = optionsFromLabels(VICTORY_TYPE_LABELS);

export function labelMapType(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  return MAP_TYPE_LABELS[value as MapType] ?? value;
}

export function labelDifficulty(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  return DIFFICULTY_LABELS[value as Difficulty] ?? value;
}

export function labelVictoryType(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  if (value === 'unknown') return 'Unknown';
  return VICTORY_TYPE_LABELS[value as Exclude<VictoryType, 'unknown'>] ?? value;
}

export function selectValueOrNone(value: string | null | undefined): string {
  return value == null || value === '' ? MATCH_NONE_OPTION_ID : value;
}

export function optionIdToNullable(id: string): string | null {
  return id === MATCH_NONE_OPTION_ID || id === '' ? null : id;
}

export function parseOptionalNonNegativeInt(
  raw: string,
): { ok: true; value: number | null } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: true, value: null };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, error: 'Enter a whole number (0 or greater), or leave blank.' };
  }
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < 0) {
    return { ok: false, error: 'Enter a whole number (0 or greater), or leave blank.' };
  }
  return { ok: true, value };
}

export function truncateNotes(notes: string, maxChars = 120): string {
  if (notes.length <= maxChars) return notes;
  return `${notes.slice(0, maxChars)}…`;
}
