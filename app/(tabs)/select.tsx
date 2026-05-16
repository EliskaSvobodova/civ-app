import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Button, Card, Divider, Searchbar, Text } from 'react-native-paper';

import { Screen } from '@/components/ui/Screen';
import { getAllCivilizations, pickRandomCivilization } from '@/services';
import type { Civilization } from '@/types';

function CivilizationDetails({ civilization }: { civilization: Civilization }) {
  return (
    <Card.Content>
      <Text variant="titleLarge">{civilization.name}</Text>
      <Text variant="bodyMedium" className="mt-1 text-neutral-600 dark:text-neutral-400">
        {civilization.leader.name}
      </Text>

      <Text variant="titleSmall" className="mt-4">
        {civilization.uniqueAbility.name}
      </Text>
      <Text variant="bodyMedium" className="mt-1">
        {civilization.uniqueAbility.description}
      </Text>

      {civilization.uniqueUnits.length > 0 ? (
        <>
          <Divider className="my-4" />
          <Text variant="titleSmall">Unique units</Text>
          {civilization.uniqueUnits.map((unit) => (
            <View key={unit.id} className="mt-2">
              <Text variant="bodyLarge">{unit.name}</Text>
              {unit.replaces ? (
                <Text variant="bodySmall" className="text-neutral-600 dark:text-neutral-400">
                  Replaces {unit.replaces.name}
                </Text>
              ) : null}
              {unit.strategy ? (
                <Text variant="bodyMedium" className="mt-1">
                  {unit.strategy}
                </Text>
              ) : null}
            </View>
          ))}
        </>
      ) : null}

      {civilization.uniqueBuildings && civilization.uniqueBuildings.length > 0 ? (
        <>
          <Divider className="my-4" />
          <Text variant="titleSmall">Unique buildings</Text>
          {civilization.uniqueBuildings.map((building) => (
            <View key={building.id} className="mt-2">
              <Text variant="bodyLarge">{building.name}</Text>
              {building.replaces ? (
                <Text variant="bodySmall" className="text-neutral-600 dark:text-neutral-400">
                  Replaces {building.replaces.name}
                </Text>
              ) : null}
              {building.strategy ? (
                <Text variant="bodyMedium" className="mt-1">
                  {building.strategy}
                </Text>
              ) : null}
            </View>
          ))}
        </>
      ) : null}

      {civilization.uniqueWonders && civilization.uniqueWonders.length > 0 ? (
        <>
          <Divider className="my-4" />
          <Text variant="titleSmall">Unique wonders</Text>
          {civilization.uniqueWonders.map((wonder) => (
            <View key={wonder.id} className="mt-2">
              <Text variant="bodyLarge">{wonder.name}</Text>
              {wonder.strategy ? (
                <Text variant="bodyMedium" className="mt-1">
                  {wonder.strategy}
                </Text>
              ) : null}
            </View>
          ))}
        </>
      ) : null}
    </Card.Content>
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
    <Screen className="flex-1 p-4">
      <Text variant="headlineSmall">Civilization selection</Text>
      <Text variant="bodyMedium" className="mt-1 text-neutral-600 dark:text-neutral-400">
        {civilizations.length} Vox Populi civilizations
      </Text>

      <View className="mt-4 flex-row gap-2">
        <Searchbar
          placeholder="Search by civ or leader"
          value={query}
          onChangeText={setQuery}
          className="flex-1"
          style={{ flex: 1 }}
        />
      </View>

      <Button mode="contained" className="mt-3" onPress={handleRandomPick}>
        Random civilization
      </Button>

      {selection ? (
        <Card className="mt-4">
          <CivilizationDetails civilization={selection} />
        </Card>
      ) : null}

      <FlatList
        className="mt-4 flex-1"
        data={filtered}
        keyExtractor={(item) => item.slug}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={Divider}
        renderItem={({ item }) => {
          const isSelected = selection?.slug === item.slug;

          return (
            <Pressable
              onPress={() => setSelection(item)}
              className={`py-3 ${isSelected ? 'bg-amber-50 dark:bg-amber-950/30' : ''}`}>
              <Text variant="titleMedium">{item.name}</Text>
              <Text variant="bodySmall" className="text-neutral-600 dark:text-neutral-400">
                {item.leader.name}
              </Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text variant="bodyMedium" className="py-6 text-center text-neutral-600 dark:text-neutral-400">
            No civilizations match your search.
          </Text>
        }
      />
    </Screen>
  );
}
