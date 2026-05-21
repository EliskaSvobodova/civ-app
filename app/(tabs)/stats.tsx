import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';

import { CivilizationEmblem } from '@/components/civilization/CivilizationEmblem';
import { CivilizationLeaderHeader } from '@/components/civilization/CivilizationLeaderHeader';
import { Heading } from '@/components/ui/Heading';
import { ImperialCard } from '@/components/ui/ImperialCard';
import { Screen } from '@/components/ui/Screen';
import { imperialFonts } from '@/constants/theme';
import {
  getCivilizationByKey,
  getTopCivilizationsByWins,
  type CivilizationWinCount,
} from '@/services';

function formatWinCount(wins: number): string {
  return wins === 1 ? '1 win' : `${wins} wins`;
}

export default function StatsScreen() {
  const [topCivs, setTopCivs] = useState<CivilizationWinCount[]>([]);

  const loadStats = useCallback(async () => {
    try {
      const stats = await getTopCivilizationsByWins(3);
      setTopCivs(stats);
    } catch {
      setTopCivs([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  return (
    <Screen className="flex-1 px-margin-mobile pt-4">
      <Heading level="md">Statistics</Heading>
      <Text variant="bodySmall" className="mt-1 text-on-surface-variant">
        Top civilizations by match wins
      </Text>

      {topCivs.length === 0 ? (
        <Text variant="bodyMedium" className="mt-3 text-on-surface-variant">
          No winners recorded yet. Commit games on Select, then set winners in Match history.
        </Text>
      ) : (
        <ScrollView className="mt-4 flex-1" keyboardShouldPersistTaps="handled">
          {topCivs.map((entry, index) => {
            const civilization = getCivilizationByKey(entry.civilizationKey);
            const displayName = civilization?.name ?? entry.civilizationKey.replace(/-/g, ' ');

            return (
              <View key={entry.civilizationKey}>
                {index > 0 ? <Divider className="my-3 bg-outline" /> : null}
                <ImperialCard className="overflow-hidden">
                  <View className="flex-row items-start gap-3 p-4">
                    <Text
                      className="w-6 text-xl text-secondary"
                      style={{ fontFamily: imperialFonts.serifBold }}>
                      {index + 1}
                    </Text>
                    {civilization ? (
                      <View className="min-w-0 flex-1">
                        <CivilizationLeaderHeader civilization={civilization} />
                        <Text variant="bodyMedium" className="mt-2 text-secondary">
                          {formatWinCount(entry.wins)}
                        </Text>
                      </View>
                    ) : (
                      <View className="min-w-0 flex-1">
                        <Text
                          variant="titleMedium"
                          className="font-serif text-primary"
                          style={{ fontFamily: imperialFonts.serifBold }}>
                          {displayName}
                        </Text>
                        <Text variant="bodyMedium" className="mt-2 text-secondary">
                          {formatWinCount(entry.wins)}
                        </Text>
                      </View>
                    )}
                    <CivilizationEmblem name={displayName} />
                  </View>
                </ImperialCard>
              </View>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}
