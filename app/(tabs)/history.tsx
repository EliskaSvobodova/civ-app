import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native-paper';

import { Heading } from '@/components/ui/Heading';
import { Screen } from '@/components/ui/Screen';

export default function HistoryScreen() {
  const { civ } = useLocalSearchParams<{ civ?: string }>();

  return (
    <Screen className="items-center justify-center px-margin-mobile">
      <Heading level="md">Match history</Heading>
      {civ ? (
        <Text variant="titleSmall" className="mt-3 uppercase tracking-wide text-primary">
          {civ.replace(/-/g, ' ')}
        </Text>
      ) : null}
      <Text variant="bodyMedium" className="mt-2 text-center text-on-surface-variant">
        Record wins, losses, victory types, and notes from your games.
      </Text>
    </Screen>
  );
}
