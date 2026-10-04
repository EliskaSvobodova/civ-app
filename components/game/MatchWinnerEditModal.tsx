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

import { SearchableSelectField } from '@/components/ui/SearchableSelectField';
import {
  getAllCivilizations,
  getCivilizationByKey,
  type GameHistoryEntry,
  type GameWinner,
  type UpdateGameMatchInput,
} from '@/services';
import {
  isoToLocalDateInput,
  parseLocalDateToIso,
  todayLocalDateInput,
} from '@/utils/gameDateTime';
import {
  labelVictoryType,
  optionIdToNullable,
  parseOptionalNonNegativeInt,
  selectValueOrNone,
  VICTORY_TYPE_OPTIONS,
} from '@/utils/matchMetadata';
import { parseHumanWinnerScores } from '@/utils/winnerScores';

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

function seedHumanScoreTexts(entry: GameHistoryEntry): Record<number, string> {
  const texts: Record<number, string> = {};
  for (const participant of entry.participants) {
    texts[participant.playerId] =
      participant.score == null ? '' : String(participant.score);
  }
  return texts;
}

export function MatchWinnerEditModal({
  entry,
  visible,
  onDismiss,
  onSave,
}: MatchWinnerEditModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mode, setMode] = useState<WinnerMode>('human');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [selectedAiCivKey, setSelectedAiCivKey] = useState<string | null>(null);
  const [victoryType, setVictoryType] = useState<string | null>(null);
  const [aiScoreText, setAiScoreText] = useState('');
  const [humanScoreTexts, setHumanScoreTexts] = useState<Record<number, string>>({});
  const [turnCountText, setTurnCountText] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const participantCivKeys = useMemo(() => {
    if (!entry) return new Set<string>();
    return new Set(entry.participants.map((participant) => participant.civilizationKey));
  }, [entry]);

  const aiCivilizationOptions = useMemo(() => {
    return getAllCivilizations().filter((civ) => !participantCivKeys.has(civ.slug));
  }, [participantCivKeys]);

  const victoryTypeOptions = useMemo(() => {
    if (victoryType == null || victoryType === '') {
      return VICTORY_TYPE_OPTIONS;
    }
    if (VICTORY_TYPE_OPTIONS.some((option) => option.id === victoryType)) {
      return VICTORY_TYPE_OPTIONS;
    }
    const [noneOption, ...rest] = VICTORY_TYPE_OPTIONS;
    return [
      noneOption,
      {
        id: victoryType,
        name: labelVictoryType(victoryType) ?? victoryType,
      },
      ...rest,
    ];
  }, [victoryType]);

  useEffect(() => {
    if (!entry || !visible) {
      return;
    }
    const winner = entry.winner;
    setStartDate(isoToLocalDateInput(entry.startedAt));
    setEndDate(
      entry.endedAt ? isoToLocalDateInput(entry.endedAt) : todayLocalDateInput(),
    );
    setMode(winnerToMode(winner));
    setSelectedPlayerIds(winnerToSelectedPlayerIds(entry, winner));
    setSelectedAiCivKey(winnerToAiCivilizationKey(winner));
    setVictoryType(
      entry.victoryType == null || entry.victoryType === ''
        ? null
        : entry.victoryType,
    );
    setAiScoreText(entry.score == null ? '' : String(entry.score));
    setHumanScoreTexts(seedHumanScoreTexts(entry));
    setTurnCountText(entry.turnCount == null ? '' : String(entry.turnCount));
    setNotes(entry.notes ?? '');
    setSaveError(null);
  }, [entry, visible]);

  const togglePlayer = (playerId: number) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds((current) => current.filter((id) => id !== playerId));
      setHumanScoreTexts((current) => {
        const { [playerId]: _removed, ...rest } = current;
        return rest;
      });
    } else {
      setSelectedPlayerIds((current) => [...current, playerId]);
      const participant = entry?.participants.find((p) => p.playerId === playerId);
      setHumanScoreTexts((current) => ({
        ...current,
        [playerId]:
          participant?.score == null ? '' : String(participant.score),
      }));
    }
  };

  const selectAllPlayers = () => {
    if (!entry) return;
    setSelectedPlayerIds(participantPlayerIds(entry));
    setHumanScoreTexts((current) => {
      const next = { ...current };
      for (const participant of entry.participants) {
        if (!(participant.playerId in next)) {
          next[participant.playerId] =
            participant.score == null ? '' : String(participant.score);
        }
      }
      return next;
    });
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

    if (!startDate.trim()) {
      setSaveError('Enter the date when the game started.');
      return;
    }

    if (!endDate.trim()) {
      setSaveError('Enter the date when the game ended.');
      return;
    }

    let startedAt: string;
    try {
      startedAt = parseLocalDateToIso(startDate, entry.startedAt);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Invalid start date');
      return;
    }

    let endedAt: string;
    try {
      endedAt = parseLocalDateToIso(endDate, entry.endedAt ?? undefined);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Invalid end date');
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

    const turnsParsed = parseOptionalNonNegativeInt(turnCountText);
    if (!turnsParsed.ok) {
      setSaveError(turnsParsed.error);
      return;
    }

    const trimmedNotes = notes.trim();

    setIsSaving(true);
    setSaveError(null);
    try {
      if (mode === 'human') {
        const drafts = selectedPlayerIds.map((playerId) => ({
          playerId,
          playerName:
            entry.participants.find((p) => p.playerId === playerId)?.playerName ??
            `Player ${playerId}`,
          raw: humanScoreTexts[playerId] ?? '',
        }));
        const parsed = parseHumanWinnerScores(drafts);
        if (!parsed.ok) {
          setSaveError(parsed.error);
          setIsSaving(false);
          return;
        }
        await onSave(entry.id, {
          startedAt,
          endedAt,
          winner,
          victoryType,
          winnerScores: parsed.values,
          score: null,
          turnCount: turnsParsed.value,
          notes: trimmedNotes === '' ? null : trimmedNotes,
        });
      } else {
        const scoreParsed = parseOptionalNonNegativeInt(aiScoreText);
        if (!scoreParsed.ok) {
          setSaveError(scoreParsed.error);
          setIsSaving(false);
          return;
        }
        await onSave(entry.id, {
          startedAt,
          endedAt,
          winner,
          victoryType,
          score: scoreParsed.value,
          winnerScores: undefined,
          turnCount: turnsParsed.value,
          notes: trimmedNotes === '' ? null : trimmedNotes,
        });
      }
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
              </View>
              <View className="gap-2">
                <Text variant="labelMedium" className="uppercase tracking-wide text-primary">
                  Game end
                </Text>
                <TextInput
                  label="Date"
                  value={endDate}
                  onChangeText={setEndDate}
                  mode="outlined"
                  placeholder="YYYY-MM-DD"
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

              <Divider className="bg-outline" />
              <Text variant="labelMedium" className="uppercase tracking-wide text-primary">
                Result details (optional)
              </Text>
              <SearchableSelectField
                label="Victory type"
                value={selectValueOrNone(victoryType)}
                options={victoryTypeOptions}
                placeholder="None"
                searchable={false}
                disabled={isSaving}
                onChange={(id) => setVictoryType(optionIdToNullable(id))}
              />
              {mode === 'human' ? (
                selectedPlayerIds.map((playerId) => {
                  const name =
                    entry.participants.find((p) => p.playerId === playerId)?.playerName ??
                    `Player ${playerId}`;
                  return (
                    <TextInput
                      key={playerId}
                      label={`Score — ${name}`}
                      value={humanScoreTexts[playerId] ?? ''}
                      onChangeText={(text) =>
                        setHumanScoreTexts((current) => ({ ...current, [playerId]: text }))
                      }
                      mode="outlined"
                      keyboardType="number-pad"
                      disabled={isSaving}
                    />
                  );
                })
              ) : (
                <TextInput
                  label="Score"
                  value={aiScoreText}
                  onChangeText={setAiScoreText}
                  mode="outlined"
                  keyboardType="number-pad"
                  disabled={isSaving}
                />
              )}
              <TextInput
                label="Turn count"
                value={turnCountText}
                onChangeText={setTurnCountText}
                mode="outlined"
                keyboardType="number-pad"
                disabled={isSaving}
              />
              <TextInput
                label="Notes"
                value={notes}
                onChangeText={setNotes}
                mode="outlined"
                multiline
                numberOfLines={3}
                disabled={isSaving}
              />

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
              !endDate.trim() ||
              (mode === 'human' ? selectedPlayerIds.length === 0 : !selectedAiCivKey)
            }>
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
