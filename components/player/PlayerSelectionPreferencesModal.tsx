import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Button,
  Checkbox,
  Dialog,
  Divider,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';

import type { Player } from '@/services';
import type { Civilization } from '@/types';
import {
  DEFAULT_PLAYER_SELECTION_PREFERENCES,
  type PlayerSelectionPreferences,
} from '@/types/playerSelectionPreferences';

type PlayerSelectionPreferencesModalProps = {
  player: Player | null;
  civilizations: Civilization[];
  visible: boolean;
  initialPreferences: PlayerSelectionPreferences;
  onDismiss: () => void;
  onSave: (preferences: PlayerSelectionPreferences) => Promise<void>;
};

export function PlayerSelectionPreferencesModal({
  player,
  civilizations,
  visible,
  initialPreferences,
  onDismiss,
  onSave,
}: PlayerSelectionPreferencesModalProps) {
  const [preferences, setPreferences] = useState<PlayerSelectionPreferences>(
    DEFAULT_PLAYER_SELECTION_PREFERENCES,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setPreferences(initialPreferences);
    setSaveError(null);
  }, [visible, initialPreferences]);

  const sortedCivilizations = useMemo(
    () => [...civilizations].sort((a, b) => a.name.localeCompare(b.name)),
    [civilizations],
  );

  const toggleExcludedSlug = (slug: string) => {
    setPreferences((current) => {
      const excluded = new Set(current.excludedSlugs);
      if (excluded.has(slug)) {
        excluded.delete(slug);
      } else {
        excluded.add(slug);
      }
      return { ...current, excludedSlugs: [...excluded] };
    });
  };

  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);
    try {
      await onSave(preferences);
      onDismiss();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={{ maxHeight: '90%' }}>
      <Dialog.Title>Random selection preferences</Dialog.Title>
      <Dialog.Content>
        {player ? (
          <Text variant="bodyMedium" className="mb-3 text-on-surface-variant">
            Configure how civilizations are chosen randomly for {player.name}.
          </Text>
        ) : null}
        <View className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text variant="bodyLarge">Avoid recently played</Text>
            <Text variant="bodySmall" className="text-on-surface-variant">
              Skips civilizations from recent games when other options exist.
            </Text>
          </View>
          <Switch
            value={preferences.avoidRecentlyPlayed}
            onValueChange={(avoidRecentlyPlayed) =>
              setPreferences((current) => ({ ...current, avoidRecentlyPlayed }))
            }
          />
        </View>
        {preferences.avoidRecentlyPlayed ? (
          <TextInput
            label="Recent games to consider"
            value={String(preferences.recentGamesCount)}
            onChangeText={(text) => {
              const parsed = Number.parseInt(text, 10);
              if (!Number.isFinite(parsed)) return;
              setPreferences((current) => ({
                ...current,
                recentGamesCount: Math.min(Math.max(parsed, 1), 20),
              }));
            }}
            mode="outlined"
            keyboardType="number-pad"
            className="mt-3"
            disabled={isSaving}
          />
        ) : null}
        <Text variant="titleSmall" className="mb-1 mt-4">
          Excluded civilizations
        </Text>
        <Text variant="bodySmall" className="mb-2 text-on-surface-variant">
          Checked civilizations will not be picked randomly for this player.
        </Text>
      </Dialog.Content>
      <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View className="px-6 py-2">
            {sortedCivilizations.map((civilization, index) => (
              <View key={civilization.slug}>
                {index > 0 ? <Divider className="bg-outline" /> : null}
                <Checkbox.Item
                  label={`${civilization.name} (${civilization.leader.name})`}
                  status={
                    preferences.excludedSlugs.includes(civilization.slug)
                      ? 'checked'
                      : 'unchecked'
                  }
                  onPress={() => toggleExcludedSlug(civilization.slug)}
                  disabled={isSaving}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </Dialog.ScrollArea>
      <Dialog.Content>
        {saveError ? (
          <Text variant="bodySmall" className="text-red-700">
            {saveError}
          </Text>
        ) : null}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} disabled={isSaving}>
          Cancel
        </Button>
        <Button mode="contained" onPress={handleSave} loading={isSaving} disabled={isSaving}>
          Save
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
