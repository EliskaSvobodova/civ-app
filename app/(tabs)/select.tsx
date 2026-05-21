import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Button,
  Checkbox,
  Dialog,
  Divider,
  IconButton,
  Portal,
  Text,
  TextInput
} from 'react-native-paper';

import { CivilizationEmblem } from '@/components/civilization/CivilizationEmblem';
import { Heading } from '@/components/ui/Heading';
import { ImperialCard } from '@/components/ui/ImperialCard';
import { Screen } from '@/components/ui/Screen';
import {
  createGame,
  createPlayer,
  deletePlayer,
  getAllCivilizations,
  getAllPlayers,
  type Player,
} from '@/services';
import type { Civilization } from '@/types';

function pickRandomCivilizationExcluding(
  civilizations: Civilization[],
  usedSlugs: Set<string>,
): Civilization {
  const available = civilizations.filter((civ) => !usedSlugs.has(civ.slug));
  const pool = available.length > 0 ? available : civilizations;
  return pool[Math.floor(Math.random() * pool.length)];
}

function assignCivilizationsForPlayers(
  playerIds: number[],
  previous: Record<number, Civilization>,
  civilizations: Civilization[],
): Record<number, Civilization> {
  const next: Record<number, Civilization> = {};
  const usedSlugs = new Set<string>();

  for (const id of playerIds) {
    const existing = previous[id];
    if (existing) {
      next[id] = existing;
      usedSlugs.add(existing.slug);
    }
  }

  for (const id of playerIds) {
    if (next[id]) continue;
    const pick = pickRandomCivilizationExcluding(civilizations, usedSlugs);
    next[id] = pick;
    usedSlugs.add(pick.slug);
  }

  return next;
}

function rerollCivilizationForPlayer(
  playerId: number,
  assignments: Record<number, Civilization>,
  civilizations: Civilization[],
): Civilization | null {
  const current = assignments[playerId];
  if (!current) return null;

  const usedByOthers = new Set(
    Object.entries(assignments)
      .filter(([id]) => Number(id) !== playerId)
      .map(([, civ]) => civ.slug),
  );

  let pool = civilizations.filter(
    (civ) => civ.slug !== current.slug && !usedByOthers.has(civ.slug),
  );
  if (pool.length === 0) {
    pool = civilizations.filter((civ) => civ.slug !== current.slug);
  }
  if (pool.length === 0) return current;

  return pool[Math.floor(Math.random() * pool.length)];
}

export default function SelectScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [gamePlayerIds, setGamePlayerIds] = useState<number[]>([]);
  const [civilizationAssignments, setCivilizationAssignments] = useState<
    Record<number, Civilization>
  >({});
  const [commitError, setCommitError] = useState<string | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const civilizations = useMemo(() => getAllCivilizations(), []);

  const gamePlayers = useMemo(
    () => players.filter((player) => gamePlayerIds.includes(player.id)),
    [players, gamePlayerIds],
  );

  const loadPlayers = useCallback(async () => {
    const list = await getAllPlayers();
    setPlayers(list);
  }, []);

  useEffect(() => {
    loadPlayers().catch(() => setPlayers([]));
  }, [loadPlayers]);

  const openCreateModal = () => {
    setNewPlayerName('');
    setCreateError(null);
    setCreateModalVisible(true);
  };

  const closeCreateModal = () => {
    setCreateModalVisible(false);
    setNewPlayerName('');
    setCreateError(null);
  };

  const togglePlayerInGame = (playerId: number) => {
    setGamePlayerIds((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId],
    );
  };

  const clearGame = () => {
    setGamePlayerIds([]);
    setCivilizationAssignments({});
  };

  useEffect(() => {
    if (gamePlayerIds.length === 0) {
      setCivilizationAssignments({});
      return;
    }

    setCivilizationAssignments((previous) =>
      assignCivilizationsForPlayers(gamePlayerIds, previous, civilizations),
    );
  }, [gamePlayerIds, civilizations]);

  const handleReroll = (playerId: number) => {
    setCivilizationAssignments((previous) => {
      const pick = rerollCivilizationForPlayer(playerId, previous, civilizations);
      if (!pick) return previous;
      return { ...previous, [playerId]: pick };
    });
  };

  const handleCommitGame = async () => {
    setCommitError(null);
    setIsCommitting(true);
    try {
      const assignments = gamePlayers.map((player) => {
        const civilization = civilizationAssignments[player.id];
        if (!civilization) {
          throw new Error(`Missing civilization for ${player.name}`);
        }
        return { playerId: player.id, civilization };
      });
      await createGame(assignments);
      clearGame();
    } catch (error) {
      setCommitError(error instanceof Error ? error.message : 'Failed to commit game');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleConfirmDeletePlayer = async () => {
    if (!playerToDelete) return;

    setIsDeleting(true);
    try {
      await deletePlayer(playerToDelete.id);
      setGamePlayerIds((current) => current.filter((id) => id !== playerToDelete.id));
      setPlayerToDelete(null);
      await loadPlayers();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreatePlayer = async () => {
    setCreateError(null);
    setIsCreating(true);
    try {
      await createPlayer(newPlayerName);
      await loadPlayers();
      closeCreateModal();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create player');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Screen className="flex-1 px-margin-mobile pt-4">
      <Heading level="md" className="mt-6">
        New Game
      </Heading>
      {players.length === 0 ? (
        <Text variant="bodyMedium" className="mt-1 text-on-surface-variant">
          Create players above, then add them to a new game.
        </Text>
      ) : (
        <>
          <Text variant="bodyMedium" className="mt-1 text-on-surface-variant">
            Add players to this game
          </Text>
          <View className="mt-2">
            {players.map((player) => (
              <View key={player.id} className="flex-row items-center">
                <View className="min-w-0 flex-1">
                <Checkbox.Item
                  label={player.name}
                  status={gamePlayerIds.includes(player.id) ? 'checked' : 'unchecked'}
                  onPress={() => togglePlayerInGame(player.id)}
                  labelVariant="bodyLarge"
                />
                </View>
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => setPlayerToDelete(player)}
                  accessibilityLabel={`Delete ${player.name}`}
                />
              </View>
            ))}
          </View>
          {gamePlayers.length > 0 ? (
            <View className="mt-2">
              <Text variant="bodyMedium" className="text-primary">
                {gamePlayers.length} player{gamePlayers.length === 1 ? '' : 's'} in game:{' '}
                {gamePlayers.map((p) => p.name).join(', ')}
              </Text>
              <Button mode="text" className="mt-1 self-start" onPress={clearGame}>
                Clear game
              </Button>
            </View>
          ) : (
            <Text variant="bodyMedium" className="mt-2 text-on-surface-variant">
              No players added yet.
            </Text>
          )}
        </>
      )}
      <Button mode="outlined" className="mt-3" onPress={openCreateModal}>
        Create player
      </Button>
      <Portal>
        <Dialog visible={createModalVisible} onDismiss={closeCreateModal}>
          <Dialog.Title>Create player</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Username"
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              mode="outlined"
              autoFocus
              disabled={isCreating}
            />
            {createError ? (
              <Text variant="bodySmall" className="mt-2 text-red-700">
                {createError}
              </Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeCreateModal} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCreatePlayer}
              loading={isCreating}
              disabled={isCreating || !newPlayerName.trim()}>
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={playerToDelete != null}
          onDismiss={() => !isDeleting && setPlayerToDelete(null)}>
          <Dialog.Title>Delete player?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {playerToDelete
                ? `${playerToDelete.name} will be removed from new games. Past match history is kept.`
                : null}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPlayerToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirmDeletePlayer}
              loading={isDeleting}
              disabled={isDeleting}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Heading level="md" className="mt-6">
        Civilization assignment
      </Heading>

      {gamePlayers.length === 0 ? (
        <Text variant="bodyMedium" className="mt-2 text-on-surface-variant">
          Add players to the game to assign a random civilization to each.
        </Text>
      ) : (
        <ScrollView className="mt-3 flex-1" keyboardShouldPersistTaps="handled">
          {gamePlayers.map((player, index) => {
            const civilization = civilizationAssignments[player.id];
            if (!civilization) return null;

            return (
              <View key={player.id}>
                {index > 0 ? <Divider className="my-2 bg-outline" /> : null}
                <ImperialCard className="overflow-hidden">
                  <View className="flex-row items-center gap-3 p-4">
                    <View className="min-w-0 flex-1">
                      <Text variant="titleMedium" className="font-serif text-primary">
                        {player.name}
                      </Text>
                      <Text variant="bodyMedium" className="mt-1 text-primary">
                        {civilization.name}
                      </Text>
                      <Text
                        variant="bodySmall"
                        className="uppercase tracking-wide text-on-surface-variant">
                        {civilization.leader.name}
                      </Text>
                      <Button
                        mode="outlined"
                        compact
                        className="mt-2 self-start"
                        onPress={() => handleReroll(player.id)}>
                        Reroll
                      </Button>
                    </View>
                    <CivilizationEmblem name={civilization.name} />
                  </View>
                </ImperialCard>
              </View>
            );
          })}
          <Button
            mode="contained"
            className="mt-4"
            onPress={handleCommitGame}
            loading={isCommitting}
            disabled={isCommitting}>
            Commit
          </Button>
          {commitError ? (
            <Text variant="bodySmall" className="mt-2 text-red-700">
              {commitError}
            </Text>
          ) : null}
        </ScrollView>
      )}
    </Screen>
  );
}
