import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  Chip,
  Dialog,
  Menu,
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
  const [excludeMenuVisible, setExcludeMenuVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPreferences(initialPreferences);
    setSaveError(null);
    setExcludeMenuVisible(false);
  }, [visible, initialPreferences]);

  const sortedCivilizations = useMemo(
    () => [...civilizations].sort((a, b) => a.name.localeCompare(b.name)),
    [civilizations],
  );

  const excludedCivilizations = useMemo(
    () =>
      sortedCivilizations.filter((civilization) =>
        preferences.excludedSlugs.includes(civilization.slug),
      ),
    [sortedCivilizations, preferences.excludedSlugs],
  );

  const civilizationsAvailableToExclude = useMemo(
    () =>
      sortedCivilizations.filter(
        (civilization) => !preferences.excludedSlugs.includes(civilization.slug),
      ),
    [sortedCivilizations, preferences.excludedSlugs],
  );

  const addExcludedSlug = (slug: string) => {
    setPreferences((current) => ({
      ...current,
      excludedSlugs: [...current.excludedSlugs, slug],
    }));
    setExcludeMenuVisible(false);
  };

  const removeExcludedSlug = (slug: string) => {
    setPreferences((current) => ({
      ...current,
      excludedSlugs: current.excludedSlugs.filter((excluded) => excluded !== slug),
    }));
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
          Excluded civilizations will not be picked randomly for this player.
        </Text>
        <Menu
          visible={excludeMenuVisible}
          onDismiss={() => setExcludeMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              icon="chevron-down"
              onPress={() => setExcludeMenuVisible(true)}
              disabled={isSaving || civilizationsAvailableToExclude.length === 0}
              contentStyle={{ flexDirection: 'row-reverse' }}>
              Add civilization to exclude
            </Button>
          }>
          {civilizationsAvailableToExclude.map((civilization) => (
            <Menu.Item
              key={civilization.slug}
              title={`${civilization.name} (${civilization.leader.name})`}
              onPress={() => addExcludedSlug(civilization.slug)}
            />
          ))}
        </Menu>
        {excludedCivilizations.length > 0 ? (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {excludedCivilizations.map((civilization) => (
              <Chip
                key={civilization.slug}
                mode="outlined"
                onClose={() => removeExcludedSlug(civilization.slug)}
                closeIconAccessibilityLabel={`Remove ${civilization.name} from exclusions`}
                disabled={isSaving}>
                {civilization.name}
              </Chip>
            ))}
          </View>
        ) : (
          <Text variant="bodySmall" className="mt-2 text-on-surface-variant">
            No civilizations excluded.
          </Text>
        )}
        {saveError ? (
          <Text variant="bodySmall" className="mt-3 text-red-700">
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
