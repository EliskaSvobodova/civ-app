import { Text } from 'react-native-paper';

import { Screen } from '@/components/ui/Screen';

export default function HistoryScreen() {
  return (
    <Screen className="items-center justify-center p-6">
      <Text variant="headlineSmall">Match history</Text>
      <Text variant="bodyMedium" className="mt-2 text-center text-neutral-600 dark:text-neutral-400">
        Record wins, losses, victory types, and notes from your games.
      </Text>
    </Screen>
  );
}
