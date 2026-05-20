import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Divider, IconButton, Text } from 'react-native-paper';

import { MatchWinnerEditModal } from '@/components/game/MatchWinnerEditModal';
import { Heading } from '@/components/ui/Heading';
import { ImperialCard } from '@/components/ui/ImperialCard';
import { Screen } from '@/components/ui/Screen';
import {
  getGameHistory,
  updateGameMatch,
  type GameHistoryEntry,
  type UpdateGameMatchInput,
} from '@/services';

function formatStartedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function HistoryScreen() {
  const { civ } = useLocalSearchParams<{ civ?: string }>();
  const [entries, setEntries] = useState<GameHistoryEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<GameHistoryEntry | null>(null);

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
                    <View className="min-w-0 flex-1">
                      <Text
                        variant="labelMedium"
                        className="uppercase tracking-wide text-on-surface-variant">
                        Started
                      </Text>
                      <Text variant="titleSmall" className="mt-0.5 font-serif text-primary">
                        {formatStartedAt(entry.startedAt)}
                      </Text>
                    </View>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => setEditingEntry(entry)}
                      accessibilityLabel="Edit match"
                    />
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
                    <View key={`${entry.id}-${participant.playerName}-${participant.civilizationKey}`}>
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
    </Screen>
  );
}
