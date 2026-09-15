import { getRepositories } from '@/database';
import type { CreateGameEventInput, GameEvent, GameEventType } from '@/types';
import { slugifyCustomKey } from '@/utils/eventTypeKey';

import { getCivilizationByKey } from './civilizationService';

function resolveCivilizationName(civilizationKey: string): string {
  return getCivilizationByKey(civilizationKey)?.name ?? civilizationKey;
}

function toGameEvent(record: {
  id: number;
  gameId: number;
  type: GameEventType;
  round: number;
  civilizationKey: string;
  targetKey: string | null;
  targetLabel: string | null;
  createdAt: string;
}): GameEvent {
  return {
    ...record,
    civilizationName: resolveCivilizationName(record.civilizationKey),
  };
}

export async function listEventTypes(): Promise<GameEventType[]> {
  return getRepositories().gameEvents.listEventTypes();
}

export async function createCustomEventType(label: string): Promise<GameEventType> {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new Error('Event type label is required');
  }

  const repo = getRepositories().gameEvents;
  const existingByLabel = await repo.findEventTypeByLabel(trimmed);
  if (existingByLabel) {
    throw new Error('An event type with this label already exists');
  }

  let key = slugifyCustomKey(trimmed);
  let suffix = 2;
  while (await repo.findEventTypeByKey(key)) {
    key = `${slugifyCustomKey(trimmed)}_${suffix}`;
    suffix += 1;
  }

  return repo.insertEventType({
    key,
    label: trimmed,
    isBuiltin: false,
    createdAt: new Date().toISOString(),
  });
}

export async function listGameEvents(gameId: number): Promise<GameEvent[]> {
  const rows = await getRepositories().gameEvents.listByGameId(gameId);
  return rows.map(toGameEvent);
}

export async function createGameEvent(
  gameId: number,
  input: CreateGameEventInput,
): Promise<GameEvent> {
  if (!Number.isInteger(input.round) || input.round < 0) {
    throw new Error('Round must be a non-negative integer');
  }

  const repo = getRepositories().gameEvents;
  const eventType = await repo.findEventTypeById(input.eventTypeId);
  if (!eventType) {
    throw new Error('Event type not found');
  }

  if (!getCivilizationByKey(input.civilizationKey)) {
    throw new Error('Unknown civilization');
  }

  const record = await repo.insertGameEvent({
    gameId,
    eventTypeId: input.eventTypeId,
    round: input.round,
    civilizationKey: input.civilizationKey,
    targetKey: input.targetKey ?? null,
    targetLabel: input.targetLabel ?? null,
    createdAt: new Date().toISOString(),
  });

  return toGameEvent(record);
}

export async function deleteGameEvent(eventId: number): Promise<void> {
  await getRepositories().gameEvents.deleteGameEvent(eventId);
}
