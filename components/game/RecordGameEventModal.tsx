import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Dialog, Divider, Portal, Text, TextInput } from 'react-native-paper';

import { SearchableSelectField } from '@/components/ui/SearchableSelectField';
import {
  createCustomEventType,
  createGameEvent,
  getCivilizationOptions,
  getCorporations,
  getReligions,
  getWonderOptions,
  listEventTypes,
  type GameHistoryEntry,
} from '@/services';
import type { CatalogOption, GameEventType } from '@/types';

type RecordGameEventModalProps = {
  entry: GameHistoryEntry | null;
  visible: boolean;
  onDismiss: () => void;
  onSaved?: () => void;
};

type TargetMode = 'wonder' | 'religion' | 'corporation' | 'civ' | 'custom' | 'none';

function targetModeForType(type: GameEventType | null): TargetMode {
  if (!type) return 'none';
  if (type.key === 'wonder_built') return 'wonder';
  if (type.key.startsWith('religion_')) return 'religion';
  if (type.key === 'corporation_founded') return 'corporation';
  if (type.key === 'civ_destroyed' || type.key === 'civ_revived') return 'civ';
  if (!type.isBuiltin) return 'custom';
  return 'none';
}

export function RecordGameEventModal({
  entry,
  visible,
  onDismiss,
  onSaved,
}: RecordGameEventModalProps) {
  const [eventTypes, setEventTypes] = useState<GameEventType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [round, setRound] = useState('');
  const [civilizationKey, setCivilizationKey] = useState<string | null>(null);
  const [targetKey, setTargetKey] = useState<string | null>(null);
  const [customTargetLabel, setCustomTargetLabel] = useState('');
  const [religionCustomName, setReligionCustomName] = useState('');
  const [creatingCustomType, setCreatingCustomType] = useState(false);
  const [customTypeLabel, setCustomTypeLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const civilizationOptions = useMemo(() => getCivilizationOptions(), []);
  const wonderOptions = useMemo(() => getWonderOptions(), []);
  const religionOptions = useMemo(
    () => getReligions().map((item) => ({ id: item.id, name: item.name })),
    [],
  );
  const corporationOptions = useMemo(
    () => getCorporations().map((item) => ({ id: item.id, name: item.name })),
    [],
  );

  const eventTypeOptions = useMemo(
    () => eventTypes.map((type) => ({ id: String(type.id), name: type.label })),
    [eventTypes],
  );

  const selectedType = useMemo(
    () => eventTypes.find((type) => type.id === selectedTypeId) ?? null,
    [eventTypes, selectedTypeId],
  );
  const targetMode = targetModeForType(selectedType);

  const targetOptions: CatalogOption[] = useMemo(() => {
    switch (targetMode) {
      case 'wonder':
        return wonderOptions;
      case 'religion':
        return religionOptions;
      case 'corporation':
        return corporationOptions;
      case 'civ':
        return civilizationOptions;
      default:
        return [];
    }
  }, [
    targetMode,
    wonderOptions,
    religionOptions,
    corporationOptions,
    civilizationOptions,
  ]);

  useEffect(() => {
    if (!visible || !entry) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const types = await listEventTypes();
        if (cancelled) return;
        setEventTypes(types);
        setSelectedTypeId(types[0]?.id ?? null);
      } catch {
        if (!cancelled) {
          setEventTypes([]);
          setSelectedTypeId(null);
        }
      }
    })();

    setRound('');
    setCivilizationKey(entry.participants[0]?.civilizationKey ?? null);
    setTargetKey(null);
    setCustomTargetLabel('');
    setReligionCustomName('');
    setCreatingCustomType(false);
    setCustomTypeLabel('');
    setSaveError(null);

    return () => {
      cancelled = true;
    };
  }, [visible, entry]);

  useEffect(() => {
    setTargetKey(null);
    setCustomTargetLabel('');
    setReligionCustomName('');
  }, [selectedTypeId]);

  const handleCreateCustomType = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const created = await createCustomEventType(customTypeLabel);
      const types = await listEventTypes();
      setEventTypes(types);
      setSelectedTypeId(created.id);
      setCreatingCustomType(false);
      setCustomTypeLabel('');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to create event type');
    } finally {
      setIsSaving(false);
    }
  };

  const resolveTarget = (): { targetKey: string | null; targetLabel: string | null } => {
    if (targetMode === 'custom') {
      const label = customTargetLabel.trim();
      return { targetKey: null, targetLabel: label.length > 0 ? label : null };
    }

    if (targetMode === 'none') {
      return { targetKey: null, targetLabel: null };
    }

    if (!targetKey) {
      throw new Error('Select an event target');
    }

    const option = targetOptions.find((item) => item.id === targetKey);
    if (!option) {
      throw new Error('Select an event target');
    }

    if (targetMode === 'religion') {
      const override = religionCustomName.trim();
      return {
        targetKey: option.id,
        targetLabel: override.length > 0 ? override : option.name,
      };
    }

    return { targetKey: option.id, targetLabel: option.name };
  };

  const handleSave = async () => {
    if (!entry) return;

    const roundNumber = Number(round);
    if (!Number.isInteger(roundNumber) || roundNumber < 0) {
      setSaveError('Enter a valid round number (0 or higher).');
      return;
    }

    if (!selectedTypeId) {
      setSaveError('Select an event type.');
      return;
    }

    if (!civilizationKey) {
      setSaveError('Select the civilization that created the event.');
      return;
    }

    let target: { targetKey: string | null; targetLabel: string | null };
    try {
      target = resolveTarget();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Invalid target');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await createGameEvent(entry.id, {
        eventTypeId: selectedTypeId,
        round: roundNumber,
        civilizationKey,
        targetKey: target.targetKey,
        targetLabel: target.targetLabel,
      });
      onSaved?.();
      onDismiss();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  if (!entry) {
    return null;
  }

  const targetRequired =
    targetMode === 'wonder' ||
    targetMode === 'religion' ||
    targetMode === 'corporation' ||
    targetMode === 'civ';

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ maxHeight: '90%' }}>
        <Dialog.Title>Record event</Dialog.Title>
        <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View className="gap-4 px-6 py-2">
              <SearchableSelectField
                label="Event type"
                value={selectedTypeId != null ? String(selectedTypeId) : null}
                options={eventTypeOptions}
                placeholder="Select event type"
                disabled={isSaving}
                searchable={eventTypeOptions.length > 8}
                onChange={(id) => {
                  setCreatingCustomType(false);
                  setSelectedTypeId(Number(id));
                }}
              />

              <Button
                mode="text"
                className="self-start"
                onPress={() => setCreatingCustomType((current) => !current)}
                disabled={isSaving}>
                {creatingCustomType ? 'Cancel custom type' : 'Create custom type…'}
              </Button>
              {creatingCustomType ? (
                <View className="gap-2">
                  <TextInput
                    label="Custom type label"
                    value={customTypeLabel}
                    onChangeText={setCustomTypeLabel}
                    mode="outlined"
                    disabled={isSaving}
                  />
                  <Button
                    mode="outlined"
                    onPress={handleCreateCustomType}
                    loading={isSaving}
                    disabled={isSaving || !customTypeLabel.trim()}>
                    Save type
                  </Button>
                </View>
              ) : null}

              <Divider className="bg-outline" />

              <TextInput
                label="Round"
                value={round}
                onChangeText={setRound}
                mode="outlined"
                keyboardType="number-pad"
                disabled={isSaving}
              />

              <SearchableSelectField
                label="Civilization"
                value={civilizationKey}
                options={civilizationOptions}
                placeholder="Select civilization"
                disabled={isSaving}
                onChange={setCivilizationKey}
              />

              {targetMode !== 'none' ? (
                <>
                  <Divider className="bg-outline" />
                  {targetMode === 'custom' ? (
                    <TextInput
                      label="Target (optional)"
                      value={customTargetLabel}
                      onChangeText={setCustomTargetLabel}
                      mode="outlined"
                      disabled={isSaving}
                    />
                  ) : (
                    <View className="gap-2">
                      <SearchableSelectField
                        label="Target"
                        value={targetKey}
                        options={targetOptions}
                        placeholder="Select target"
                        disabled={isSaving}
                        searchable={targetOptions.length > 8}
                        onChange={setTargetKey}
                      />
                      {targetMode === 'religion' ? (
                        <TextInput
                          label="Custom religion name (optional)"
                          value={religionCustomName}
                          onChangeText={setReligionCustomName}
                          mode="outlined"
                          disabled={isSaving}
                        />
                      ) : null}
                    </View>
                  )}
                </>
              ) : null}

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
              !selectedTypeId ||
              !round.trim() ||
              !civilizationKey ||
              (targetRequired && !targetKey)
            }>
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
