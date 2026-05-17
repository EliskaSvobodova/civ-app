import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { Text } from 'react-native-paper';

import { Heading } from '@/components/ui/Heading';
import { Screen } from '@/components/ui/Screen';

export default function ModalScreen() {
  return (
    <Screen className="items-center justify-center px-margin-mobile">
      <Heading level="md">Modal</Heading>
      <Text variant="bodyMedium" className="mt-4 text-center text-primary/70">
        Modal screens use the Imperial Tactician parchment surface.
      </Text>
      <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
    </Screen>
  );
}
