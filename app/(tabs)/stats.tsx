import { Text } from 'react-native-paper';

import { Screen } from '@/components/ui/Screen';

export default function StatsScreen() {
  return (
    <Screen className="items-center justify-center p-6">
      <Text variant="headlineSmall">Statistics</Text>
      <Text variant="bodyMedium" className="mt-2 text-center text-neutral-600 dark:text-neutral-400">
        Charts and long-term gameplay insights will appear here.
      </Text>
    </Screen>
  );
}
