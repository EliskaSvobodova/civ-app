import { Text } from 'react-native-paper';

import { Heading } from '@/components/ui/Heading';
import { Screen } from '@/components/ui/Screen';

export default function StatsScreen() {
  return (
    <Screen className="items-center justify-center px-margin-mobile">
      <Heading level="md">Statistics</Heading>
      <Text variant="bodyMedium" className="mt-2 text-center text-primary/70">
        Charts and long-term gameplay insights will appear here.
      </Text>
    </Screen>
  );
}
