import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Dialog, Divider, IconButton, Portal, Text } from 'react-native-paper';

import { deleteGameEvent, listGameEvents, type GameHistoryEntry } from '@/services';
import type { GameEvent } from '@/types';

type MatchEventsModalProps = {
  entry: GameHistoryEntry | null;
  visible: boolean;
  onDismiss: () => void;
};

export function MatchEventsModal({ entry, visible, onDismiss }: MatchEventsModalProps) {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [eventToRemove, setEventToRemove] = useState<GameEvent | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const loadEvents = useCallback(async (gameId: number) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const rows = await listGameEvents(gameId);
      setEvents(rows);
    } catch (error) {
      setEvents([]);
      setLoadError(error instanceof Error ? error.message : 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible || !entry) {
      return;
    }
    void loadEvents(entry.id);
  }, [visible, entry, loadEvents]);

  const handleConfirmRemove = async () => {
    if (!eventToRemove || !entry) return;
    setIsRemoving(true);
    try {
      await deleteGameEvent(eventToRemove.id);
      setEventToRemove(null);
      await loadEvents(entry.id);
    } finally {
      setIsRemoving(false);
    }
  };

  if (!entry) {
    return null;
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ maxHeight: '90%' }}>
        <Dialog.Title>Match events</Dialog.Title>
        <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View className="gap-3 px-6 py-2">
              {isLoading ? (
                <Text variant="bodyMedium" className="text-on-surface-variant">
                  Loading events…
                </Text>
              ) : null}
              {loadError ? (
                <Text variant="bodySmall" className="text-red-700">
                  {loadError}
                </Text>
              ) : null}
              {!isLoading && !loadError && events.length === 0 ? (
                <Text variant="bodyMedium" className="text-on-surface-variant">
                  No events recorded yet.
                </Text>
              ) : null}
              {events.map((event, index) => (
                <View key={event.id}>
                  {index > 0 ? <Divider className="my-2 bg-outline" /> : null}
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="min-w-0 flex-1">
                      <Text variant="titleSmall" className="font-serif text-primary">
                        {`R${event.round} · ${event.type.label} · ${event.civilizationName}`}
                      </Text>
                      {event.targetLabel ? (
                        <Text variant="bodyMedium" className="mt-0.5 text-on-surface-variant">
                          {event.targetLabel}
                        </Text>
                      ) : null}
                    </View>
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => setEventToRemove(event)}
                      accessibilityLabel="Delete event"
                    />
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Close</Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog
        visible={eventToRemove != null}
        onDismiss={() => !isRemoving && setEventToRemove(null)}>
        <Dialog.Title>Remove event?</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">
            This will permanently delete this event from the match.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setEventToRemove(null)} disabled={isRemoving}>
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
  );
}
