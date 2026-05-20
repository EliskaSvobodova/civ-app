import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Button,
  Checkbox,
  Dialog,
  Divider,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';

import {
  getAllCivilizations,
  getCivilizationByKey,
  type GameHistoryEntry,
  type GameWinner,
  type UpdateGameMatchInput,
} from '@/services';
import {
  isoToLocalDateInput,
  isoToLocalTimeInput,
  parseLocalDateTimeToIso,
} from '@/utils/gameDateTime';

type WinnerMode = 'human' | 'ai';

type MatchWinnerEditModalProps = {
  entry: GameHistoryEntry | null;
  visible: boolean;
  onDismiss: () => void;
  onSave: (gameId: number, input: UpdateGameMatchInput) => Promise<void>;
};

function participantPlayerIds(entry: GameHistoryEntry): number[] {
  return entry.participants.map((participant) => participant.playerId);
}

function winnerToMode(winner: GameWinner | null): WinnerMode {
  return winner?.kind === 'ai' ? 'ai' : 'human';
}

function winnerToSelectedPlayerIds(
  entry: GameHistoryEntry,
  winner: GameWinner | null,
): number[] {
  if (winner?.kind === 'human') {
    return winner.playerIds;
  }
  return participantPlayerIds(entry);
}

function winnerToAiCivilizationKey(winner: GameWinner | null): string | null {
  return winner?.kind === 'ai' ? winner.civilizationKey : null;
}

export function MatchWinnerEditModal({
  entry,
  visible,
  onDismiss,
  onSave,
}: MatchWinnerEditModalProps) {
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [mode, setMode] = useState<WinnerMode>('human');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [selectedAiCivKey, setSelectedAiCivKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const participantCivKeys = useMemo(() => {
    if (!entry) return new Set<string>();
    return new Set(entry.participants.map((participant) => participant.civilizationKey));
  }, [entry]);

  const aiCivilizationOptions = useMemo(() => {
    return getAllCivilizations().filter((civ) => !participantCivKeys.has(civ.slug));
  }, [participantCivKeys]);

  useEffect(() => {
    if (!entry || !visible) {
      return;
    }
    const winner = entry.winner;
    setStartDate(isoToLocalDateInput(entry.startedAt));
    setStartTime(isoToLocalTimeInput(entry.startedAt));
    setMode(winnerToMode(winner));
    setSelectedPlayerIds(winnerToSelectedPlayerIds(entry, winner));
    setSelectedAiCivKey(winnerToAiCivilizationKey(winner));
    setSaveError(null);
  }, [entry, visible]);

  const togglePlayer = (playerId: number) => {
    setSelectedPlayerIds((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId],
    );
  };

  const selectAllPlayers = () => {
    if (!entry) return;
    setSelectedPlayerIds(participantPlayerIds(entry));
  };

  const handleSave = async () => {
    if (!entry) return;

    if (mode === 'human') {
      if (selectedPlayerIds.length === 0) {
        setSaveError('Select at least one winning player.');
        return;
      }
    } else if (!selectedAiCivKey) {
      setSaveError('Select an AI civilization.');
      return;
    }

    if (!startDate.trim() || !startTime.trim()) {
      setSaveError('Enter both date and time for when the game started.');
      return;
    }

    let startedAt: string;
    try {
      startedAt = parseLocalDateTimeToIso(startDate, startTime);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Invalid start date or time');
      return;
    }

    const winner: UpdateGameMatchInput['winner'] =
      mode === 'human'
        ? { kind: 'human', playerIds: selectedPlayerIds }
        : {
            kind: 'ai',
            civilizationKey: selectedAiCivKey!,
            leaderKey:
              getCivilizationByKey(selectedAiCivKey!)?.leader.id ?? selectedAiCivKey!,
          };

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(entry.id, { startedAt, winner });
      onDismiss();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save match');
    } finally {
      setIsSaving(false);
    }
  };

  if (!entry) {
    return null;
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ maxHeight: '90%' }}>
        <Dialog.Title>Edit match</Dialog.Title>
        <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View className="gap-4 px-6 py-2">
              <View className="gap-2">
                <Text variant="labelMedium" className="uppercase tracking-wide text-primary">
                  Game start
                </Text>
                <TextInput
                  label="Date"
                  value={startDate}
                  onChangeText={setStartDate}
                  mode="outlined"
                  placeholder="YYYY-MM-DD"
                  disabled={isSaving}
                />
                <TextInput
                  label="Time"
                  value={startTime}
                  onChangeText={setStartTime}
                  mode="outlined"
                  placeholder="HH:MM"
                  disabled={isSaving}
                />
              </View>
              <Divider className="bg-outline" />
              <Text variant="labelMedium" className="uppercase tracking-wide text-primary">
                Winner
              </Text>
              <SegmentedButtons
                value={mode}
                onValueChange={(value) => setMode(value as WinnerMode)}
                buttons={[
                  { value: 'human', label: 'Players' },
                  { value: 'ai', label: 'AI civ' },
                ]}
              />

              {mode === 'human' ? (
                <View className="gap-2">
                  <Text variant="bodyMedium" className="text-on-surface-variant">
                    Choose one player or several as a winning team.
                  </Text>
                  <Button mode="text" className="self-start" onPress={selectAllPlayers}>
                    Select all players (team win)
                  </Button>
                  {entry.participants.map((participant) => (
                    <Checkbox.Item
                      key={participant.playerId}
                      label={participant.playerName}
                      status={
                        selectedPlayerIds.includes(participant.playerId)
                          ? 'checked'
                          : 'unchecked'
                      }
                      onPress={() => togglePlayer(participant.playerId)}
                    />
                  ))}
                </View>
              ) : (
                <View className="gap-2">
                  <Text variant="bodyMedium" className="text-on-surface-variant">
                    Another civilization controlled by AI won this match.
                  </Text>
                  {aiCivilizationOptions.length === 0 ? (
                    <Text variant="bodySmall" className="text-on-surface-variant">
                      Every civilization in the dataset is already in this match.
                    </Text>
                  ) : (
                    aiCivilizationOptions.map((civilization, index) => (
                      <View key={civilization.slug}>
                        {index > 0 ? <Divider className="bg-outline" /> : null}
                        <Checkbox.Item
                          label={`${civilization.name} (${civilization.leader.name})`}
                          status={
                            selectedAiCivKey === civilization.slug ? 'checked' : 'unchecked'
                          }
                          onPress={() => setSelectedAiCivKey(civilization.slug)}
                        />
                      </View>
                    ))
                  )}
                </View>
              )}

              {saveError ? (
                <Text variant="bodySmall" className="text-red-700">
                  {saveError}
                </Text>
              ) : null}
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isSaving}
            disabled={
              isSaving ||
              !startDate.trim() ||
              !startTime.trim() ||
              (mode === 'human' ? selectedPlayerIds.length === 0 : !selectedAiCivKey)
            }>
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
