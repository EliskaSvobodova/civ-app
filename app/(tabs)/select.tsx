import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Button, Divider, Searchbar, Text } from 'react-native-paper';
import { router } from 'expo-router';

import { CivilizationEmblem } from '@/components/civilization/CivilizationEmblem';
import { CivilizationExpandedDetails } from '@/components/civilization/CivilizationExpandedDetails';
import { CivilizationLeaderHeader } from '@/components/civilization/CivilizationLeaderHeader';
import { Heading } from '@/components/ui/Heading';
import { ImperialCard } from '@/components/ui/ImperialCard';
import { Screen } from '@/components/ui/Screen';
import { getAllCivilizations, pickRandomCivilization } from '@/services';
import type { Civilization } from '@/types';

function CivilizationDetails({ civilization }: { civilization: Civilization }) {
  return (
    <View className="p-6">
      <View className="flex-row items-start gap-2">
        <CivilizationLeaderHeader civilization={civilization} />
        <CivilizationEmblem name={civilization.name} />
      </View>
      <View className="mt-4">
        <CivilizationExpandedDetails
          civilization={civilization}
          onViewHistory={() =>
            router.push({
              pathname: '/history',
              params: { civ: civilization.slug },
            })
          }
        />
      </View>
    </View>
  );
}

export default function SelectScreen() {
  const civilizations = useMemo(
    () => [...getAllCivilizations()].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<Civilization | null>(null);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return civilizations;
    }

    return civilizations.filter(
      (civ) =>
        civ.name.toLowerCase().includes(normalizedQuery) ||
        civ.slug.includes(normalizedQuery) ||
        civ.leader.name.toLowerCase().includes(normalizedQuery),
    );
  }, [civilizations, query]);

  const handleRandomPick = () => {
    const pick = pickRandomCivilization();
    setSelection(pick);
    setQuery('');
  };

  return (
    <Screen className="flex-1 px-margin-mobile pt-4">
      <Heading level="md">Civilization selection</Heading>
      <Text variant="bodyMedium" className="mt-1 text-on-surface-variant">
        {civilizations.length} Vox Populi civilizations
      </Text>

      <View className="mt-4">
        <Searchbar
          placeholder="Search by civ or leader"
          value={query}
          onChangeText={setQuery}
          style={{ backgroundColor: '#f5efe9' }}
        />
      </View>

      <Button mode="contained" className="mt-3" onPress={handleRandomPick}>
        Random civilization
      </Button>

      {selection ? (
        <ImperialCard className="mt-4 overflow-hidden" selected>
          <CivilizationDetails civilization={selection} />
        </ImperialCard>
      ) : null}

      <FlatList
        className="mt-4 flex-1"
        data={filtered}
        keyExtractor={(item) => item.slug}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <Divider className="bg-outline" />}
        renderItem={({ item }) => {
          const isSelected = selection?.slug === item.slug;

          return (
            <Pressable
              onPress={() => setSelection(item)}
              className={`rounded-md border border-transparent py-3 ${
                isSelected ? 'border-l-4 border-l-secondary bg-secondary/10 pl-2' : ''
              }`}>
              <Text variant="titleMedium" className="text-primary">
                {item.name}
              </Text>
              <Text variant="bodySmall" className="uppercase tracking-wide text-on-surface-variant">
                {item.leader.name}
              </Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text variant="bodyMedium" className="py-6 text-center text-on-surface-variant">
            No civilizations match your search.
          </Text>
        }
      />
    </Screen>
  );
}
