import type { Civilization } from '@/types';

const FLAVOR_MAX_LENGTH = 280;

export function getCivilizationFlavor(civilization: Civilization): string | null {
  for (const unit of civilization.uniqueUnits) {
    if (unit.flavor) {
      return truncateFlavor(unit.flavor);
    }
  }

  for (const building of civilization.uniqueBuildings ?? []) {
    if (building.flavor) {
      return truncateFlavor(building.flavor);
    }
  }

  for (const wonder of civilization.uniqueWonders ?? []) {
    if (wonder.flavor) {
      return truncateFlavor(wonder.flavor);
    }
  }

  return null;
}

function truncateFlavor(text: string): string {
  if (text.length <= FLAVOR_MAX_LENGTH) {
    return text;
  }

  const truncated = text.slice(0, FLAVOR_MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(' ');
  const end = lastSpace > FLAVOR_MAX_LENGTH * 0.6 ? lastSpace : FLAVOR_MAX_LENGTH;

  return `${truncated.slice(0, end).trimEnd()}…`;
}

export function getCivilizationInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '?';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}
