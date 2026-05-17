import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

import { Heading } from '@/components/ui/Heading';
import { Screen } from '@/components/ui/Screen';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen className="items-center justify-center px-margin-mobile">
        <Heading level="md">This screen does not exist.</Heading>
        <Link href="/" className="mt-4">
          <Text variant="labelLarge" className="text-secondary">
            Go to Library
          </Text>
        </Link>
      </Screen>
    </>
  );
}
