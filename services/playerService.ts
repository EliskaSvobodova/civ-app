import { getRepositories } from '@/database';
import type { Player } from '@/database/repositories';

export type { Player } from '@/database/repositories';

const DUPLICATE_NAME_ERROR = 'A player with this name already exists';

function isUniqueConstraintError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('UNIQUE constraint failed');
}

export async function getAllPlayers(): Promise<Player[]> {
  return getRepositories().players.findAllActive();
}

export async function deletePlayer(playerId: number): Promise<void> {
  await getRepositories().players.softDelete(playerId, new Date().toISOString());
}

export async function createPlayer(name: string): Promise<Player> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Player name is required');
  }

  const { players } = getRepositories();
  const existing = await players.findActiveByName(trimmed);
  if (existing) {
    throw new Error(DUPLICATE_NAME_ERROR);
  }

  try {
    return await players.insert(trimmed, new Date().toISOString());
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error(DUPLICATE_NAME_ERROR);
    }
    throw error;
  }
}
