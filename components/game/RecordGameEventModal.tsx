import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Button,
  Checkbox,
  Dialog,
  Divider,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';

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
  const [civFilter, setCivFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');

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

  const selectedType = useMemo(
    () => eventTypes.find((type) => type.id === selectedTypeId) ?? null,
    [eventTypes, selectedTypeId],
  );
  const targetMode = targetModeForType(selectedType);

  const filteredCivs = useMemo(() => {
    const query = civFilter.trim().toLowerCase();
    if (!query) return civilizationOptions;
    return civilizationOptions.filter((option) =>
      option.name.toLowerCase().includes(query),
    );
  }, [civFilter, civilizationOptions]);

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

  const filteredTargets = useMemo(() => {
    const query = targetFilter.trim().toLowerCase();
    if (!query) return targetOptions;
    return targetOptions.filter((option) => option.name.toLowerCase().includes(query));
  }, [targetFilter, targetOptions]);

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
    setCivFilter('');
    setTargetFilter('');

    return () => {
      cancelled = true;
    };
  }, [visible, entry]);

  useEffect(() => {
    setTargetKey(null);
    setCustomTargetLabel('');
    setReligionCustomName('');
    setTargetFilter('');
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

  const targetRequired = targetMode === 'wonder' ||
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
              <View className="gap-2">
                <Text variant="labelMedium" className="uppercase tracking-wide text-primary">
                  Event type
                </Text>
                {eventTypes.map((type, index) => (
                  <View key={type.id}>
                    {index > 0 ? <Divider className="bg-outline" /> : null}
                    <Checkbox.Item
                      label={type.label}
                      status={selectedTypeId === type.id ? 'checked' : 'unchecked'}
                      onPress={() => {
                        setCreatingCustomType(false);
                        setSelectedTypeId(type.id);
                      }}
                    />
                  </View>
                ))}
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
              </View>

              <Divider className="bg-outline" />

              <TextInput
                label="Round"
                value={round}
                onChangeText={setRound}
                mode="outlined"
                keyboardType="number-pad"
                disabled={isSaving}
              />

              <View className="gap-2">
                <Text variant="labelMedium" className="uppercase tracking-wide text-primary">
                  Civilization
                </Text>
                <TextInput
                  label="Filter civilizations"
                  value={civFilter}
                  onChangeText={setCivFilter}
                  mode="outlined"
                  disabled={isSaving}
                />
                {filteredCivs.map((option, index) => (
                  <View key={option.id}>
                    {index > 0 ? <Divider className="bg-outline" /> : null}
                    <Checkbox.Item
                      label={option.name}
                      status={civilizationKey === option.id ? 'checked' : 'unchecked'}
                      onPress={() => setCivilizationKey(option.id)}
                    />
                  </View>
                ))}
              </View>

              {targetMode !== 'none' ? (
                <>
                  <Divider className="bg-outline" />
                  <Text variant="labelMedium" className="uppercase tracking-wide text-primary">
                    Target
                  </Text>
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
                      <TextInput
                        label="Filter targets"
                        value={targetFilter}
                        onChangeText={setTargetFilter}
                        mode="outlined"
                        disabled={isSaving}
                      />
                      {filteredTargets.map((option, index) => (
                        <View key={option.id}>
                          {index > 0 ? <Divider className="bg-outline" /> : null}
                          <Checkbox.Item
                            label={option.name}
                            status={targetKey === option.id ? 'checked' : 'unchecked'}
                            onPress={() => setTargetKey(option.id)}
                          />
                        </View>
                      ))}
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
