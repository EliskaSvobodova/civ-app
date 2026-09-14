import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Dialog, Divider, IconButton, Portal, Text } from 'react-native-paper';

import { MatchEventsModal } from '@/components/game/MatchEventsModal';
import { MatchWinnerEditModal } from '@/components/game/MatchWinnerEditModal';
import { RecordGameEventModal } from '@/components/game/RecordGameEventModal';
import { Heading } from '@/components/ui/Heading';
import { ImperialCard } from '@/components/ui/ImperialCard';
import { Screen } from '@/components/ui/Screen';
import {
  deleteGame,
  getGameHistory,
  updateGameMatch,
  type GameHistoryEntry,
  type UpdateGameMatchInput,
} from '@/services';

function formatGameDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString(undefined, {
    dateStyle: 'medium',
  });
}

export default function HistoryScreen() {
  const { civ } = useLocalSearchParams<{ civ?: string }>();
  const [entries, setEntries] = useState<GameHistoryEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<GameHistoryEntry | null>(null);
  const [recordingEntry, setRecordingEntry] = useState<GameHistoryEntry | null>(null);
  const [eventsEntry, setEventsEntry] = useState<GameHistoryEntry | null>(null);
  const [entryToRemove, setEntryToRemove] = useState<GameHistoryEntry | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const history = await getGameHistory();
      setEntries(history);
    } catch {
      setEntries([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const filteredEntries = useMemo(() => {
    if (!civ) return entries;
    return entries.filter((entry) =>
      entry.participants.some((participant) => participant.civilizationKey === civ),
    );
  }, [civ, entries]);

  const handleSaveMatch = async (gameId: number, input: UpdateGameMatchInput) => {
    await updateGameMatch(gameId, input);
    await loadHistory();
  };

  const handleConfirmRemove = async () => {
    if (!entryToRemove) return;

    setIsRemoving(true);
    try {
      await deleteGame(entryToRemove.id);
      if (editingEntry?.id === entryToRemove.id) {
        setEditingEntry(null);
      }
      if (recordingEntry?.id === entryToRemove.id) {
        setRecordingEntry(null);
      }
      if (eventsEntry?.id === entryToRemove.id) {
        setEventsEntry(null);
      }
      setEntryToRemove(null);
      await loadHistory();
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Screen className="flex-1 px-margin-mobile pt-4">
      <Heading level="md">Match history</Heading>
      {civ ? (
        <Text variant="titleSmall" className="mt-2 uppercase tracking-wide text-primary">
          {civ.replace(/-/g, ' ')}
        </Text>
      ) : null}

      {filteredEntries.length === 0 ? (
        <Text variant="bodyMedium" className="mt-3 text-on-surface-variant">
          {civ
            ? 'No committed games include this civilization yet.'
            : 'No games committed yet. Set up players on Select and tap Commit.'}
        </Text>
      ) : (
        <ScrollView className="mt-4 flex-1" keyboardShouldPersistTaps="handled">
          {filteredEntries.map((entry, index) => (
            <View key={entry.id}>
              {index > 0 ? <Divider className="my-3 bg-outline" /> : null}
              <ImperialCard className="overflow-hidden">
                <View className="p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="min-w-0 flex-1 flex-row flex-wrap gap-x-6 gap-y-2">
                      <View>
                        <Text
                          variant="labelMedium"
                          className="uppercase tracking-wide text-on-surface-variant">
                          Started
                        </Text>
                        <Text variant="titleSmall" className="mt-0.5 font-serif text-primary">
                          {formatGameDate(entry.startedAt)}
                        </Text>
                      </View>
                      {entry.endedAt ? (
                        <View>
                          <Text
                            variant="labelMedium"
                            className="uppercase tracking-wide text-on-surface-variant">
                            Ended
                          </Text>
                          <Text variant="titleSmall" className="mt-0.5 font-serif text-primary">
                            {formatGameDate(entry.endedAt)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View className="flex-row flex-wrap justify-end">
                      <IconButton
                        icon="calendar-plus"
                        size={20}
                        onPress={() => setRecordingEntry(entry)}
                        accessibilityLabel="Record event"
                      />
                      <IconButton
                        icon="timeline-text"
                        size={20}
                        onPress={() => setEventsEntry(entry)}
                        accessibilityLabel="View events"
                      />
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => setEditingEntry(entry)}
                        accessibilityLabel="Edit match"
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => setEntryToRemove(entry)}
                        accessibilityLabel="Remove match"
                      />
                    </View>
                  </View>
                  {entry.winnerLabel ? (
                    <>
                      <Text
                        variant="labelMedium"
                        className="mt-3 uppercase tracking-wide text-on-surface-variant">
                        Winner
                      </Text>
                      <Text variant="titleSmall" className="mt-0.5 font-serif text-secondary">
                        {entry.winnerLabel}
                      </Text>
                    </>
                  ) : null}
                  <Divider className="my-3 bg-outline" />
                  {entry.participants.map((participant, participantIndex) => (
                    <View
                      key={`${entry.id}-${participant.playerName}-${participant.civilizationKey}`}>
                      {participantIndex > 0 ? (
                        <Divider className="my-2 bg-outline" />
                      ) : null}
                      <Text variant="titleMedium" className="font-serif text-primary">
                        {participant.playerName}
                      </Text>
                      <Text variant="bodyMedium" className="mt-0.5 text-primary">
                        {participant.civilizationName}
                      </Text>
                      <Text
                        variant="bodySmall"
                        className="uppercase tracking-wide text-on-surface-variant">
                        {participant.leaderName}
                      </Text>
                    </View>
                  ))}
                </View>
              </ImperialCard>
            </View>
          ))}
        </ScrollView>
      )}
      <MatchWinnerEditModal
        entry={editingEntry}
        visible={editingEntry != null}
        onDismiss={() => setEditingEntry(null)}
        onSave={handleSaveMatch}
      />
      <RecordGameEventModal
        entry={recordingEntry}
        visible={recordingEntry != null}
        onDismiss={() => setRecordingEntry(null)}
      />
      <MatchEventsModal
        entry={eventsEntry}
        visible={eventsEntry != null}
        onDismiss={() => setEventsEntry(null)}
      />
      <Portal>
        <Dialog
          visible={entryToRemove != null}
          onDismiss={() => !isRemoving && setEntryToRemove(null)}>
          <Dialog.Title>Remove match?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              This will permanently delete this game from your history.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEntryToRemove(null)} disabled={isRemoving}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirmRemove}
              loading={isRemoving}
              disabled={isRemoving}>
              Remove
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}
