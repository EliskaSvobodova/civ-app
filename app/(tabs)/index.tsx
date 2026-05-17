import { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { Text } from 'react-native-paper';

import { CivilizationListItem } from '@/components/civilization/CivilizationListItem';
import { Heading } from '@/components/ui/Heading';
import { Screen } from '@/components/ui/Screen';
import { getAllCivilizations } from '@/services';

export default function HomeScreen() {
  const civilizations = useMemo(
    () => [...getAllCivilizations()].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  return (
    <Screen className="flex-1">
      <View className="px-margin-mobile pt-4">
        <Heading level="lg">Imperial Tactician</Heading>
        <Text variant="bodyLarge" className="mt-2 text-on-surface-variant">
          Your offline-first Civilization V companion
        </Text>
        <Heading level="sm" className="mt-6">
          Civilizations
        </Heading>
        <Text variant="bodySmall" className="mt-1 text-on-surface-variant">
          {civilizations.length} Vox Populi civilizations
        </Text>
      </View>

      <FlatList
        className="mt-2 flex-1 px-margin-mobile"
        data={civilizations}
        keyExtractor={(item) => item.slug}
        renderItem={({ item }) => <CivilizationListItem civilization={item} />}
      />
    </Screen>
  );
}
