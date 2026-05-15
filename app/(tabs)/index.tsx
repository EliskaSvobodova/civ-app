import { Link } from 'expo-router';
import { Button, Text } from 'react-native-paper';

import { Screen } from '@/components/ui/Screen';

export default function HomeScreen() {
  return (
    <Screen className="items-center justify-center p-6">
      <Text variant="headlineMedium" className="text-center">
        Civ App
      </Text>
      <Text variant="bodyLarge" className="mt-2 text-center text-neutral-600 dark:text-neutral-400">
        Your offline-first Civilization V companion
      </Text>
      <Link href="/select" asChild>
        <Button mode="contained" className="mt-8">
          Pick a civilization
        </Button>
      </Link>
    </Screen>
  );
}
