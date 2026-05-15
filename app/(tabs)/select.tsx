import { useState } from 'react';
import { Button, Card, Text } from 'react-native-paper';

import { Screen } from '@/components/ui/Screen';
import { pickRandomCivilization } from '@/services';
import type { Civilization } from '@/types';

export default function SelectScreen() {
  const [selection, setSelection] = useState<Civilization | null>(null);

  const handleRandomPick = () => {
    setSelection(pickRandomCivilization());
  };

  return (
    <Screen className="p-4">
      <Text variant="headlineSmall">Civilization selection</Text>
      <Text variant="bodyMedium" className="mt-1 text-neutral-600 dark:text-neutral-400">
        Random picks from your local Civ V dataset
      </Text>

      <Button mode="contained" className="mt-6" onPress={handleRandomPick}>
        Random civilization
      </Button>

      {selection ? (
        <Card className="mt-6">
          <Card.Content>
            <Text variant="titleLarge">{selection.name}</Text>
            <Text variant="bodyMedium" className="mt-2">
              Leaders: {selection.leaders.map((leader) => leader.name).join(', ')}
            </Text>
          </Card.Content>
        </Card>
      ) : null}
    </Screen>
  );
}
