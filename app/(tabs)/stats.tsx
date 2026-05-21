import { useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';

import { CivilizationEmblem } from '@/components/civilization/CivilizationEmblem';
import { CivilizationLeaderHeader } from '@/components/civilization/CivilizationLeaderHeader';
import { GameLengthAxisChart } from '@/components/stats/GameLengthAxisChart';
import { Heading } from '@/components/ui/Heading';
import { ImperialCard } from '@/components/ui/ImperialCard';
import { Screen } from '@/components/ui/Screen';
import { imperialFonts } from '@/constants/theme';
import {
  getCivilizationByKey,
  getGameDurationDays,
  getTopCivilizationsByWins,
  getTopPlayersByWins,
  type CivilizationWinCount,
  type PlayerWinLeaderboardEntry,
} from '@/services';

function formatWinCount(wins: number): string {
  return wins === 1 ? '1 win' : `${wins} wins`;
}

function LeaderboardRank({ rank }: { rank: number }) {
  return (
    <Text className="w-6 text-xl text-secondary" style={{ fontFamily: imperialFonts.serifBold }}>
      {rank}
    </Text>
  );
}

function CivilizationLeaderboardCard({
  entry,
  rank,
}: {
  entry: CivilizationWinCount;
  rank: number;
}) {
  const civilization = getCivilizationByKey(entry.civilizationKey);
  const displayName = civilization?.name ?? entry.civilizationKey.replace(/-/g, ' ');

  return (
    <ImperialCard className="overflow-hidden">
      <View className="flex-row items-start gap-3 p-4">
        <LeaderboardRank rank={rank} />
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
  );
}

function PlayerLeaderboardCard({
  entry,
  rank,
}: {
  entry: PlayerWinLeaderboardEntry;
  rank: number;
}) {
  return (
    <ImperialCard className="overflow-hidden">
      <View className="flex-row items-start gap-3 p-4">
        <LeaderboardRank rank={rank} />
        <View className="min-w-0 flex-1">
          <Text
            variant="titleMedium"
            className="font-serif text-primary"
            style={{ fontFamily: imperialFonts.serifBold }}>
            {entry.name}
          </Text>
          {entry.kind === 'ai' ? (
            <Text variant="bodySmall" className="mt-0.5 uppercase tracking-wide text-on-surface-variant">
              Any civilization
            </Text>
          ) : null}
          <Text variant="bodyMedium" className="mt-2 text-secondary">
            {formatWinCount(entry.wins)}
          </Text>
        </View>
      </View>
    </ImperialCard>
  );
}

function StatsSection({
  title,
  emptyMessage,
  children,
}: {
  title: string;
  emptyMessage: string;
  children: ReactNode | null;
}) {
  return (
    <View>
      <Text variant="titleSmall" className="font-serif text-primary">
        {title}
      </Text>
      {children ?? (
        <Text variant="bodyMedium" className="mt-2 text-on-surface-variant">
          {emptyMessage}
        </Text>
      )}
    </View>
  );
}

export default function StatsScreen() {
  const [topCivs, setTopCivs] = useState<CivilizationWinCount[]>([]);
  const [topPlayers, setTopPlayers] = useState<PlayerWinLeaderboardEntry[]>([]);
  const [gameDurations, setGameDurations] = useState<number[]>([]);

  const loadStats = useCallback(async () => {
    try {
      const [civs, players, durations] = await Promise.all([
        getTopCivilizationsByWins(3),
        getTopPlayersByWins(3),
        getGameDurationDays(),
      ]);
      setTopCivs(civs);
      setTopPlayers(players);
      setGameDurations(durations);
    } catch {
      setTopCivs([]);
      setTopPlayers([]);
      setGameDurations([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  const hasLeaderboards = topCivs.length > 0 || topPlayers.length > 0;
  const showGameLengthChart = gameDurations.length >= 3;
  const hasContent = hasLeaderboards || showGameLengthChart;

  return (
    <Screen className="flex-1 px-margin-mobile pt-4">
      <Heading level="md">Statistics</Heading>
      <Text variant="bodySmall" className="mt-1 text-on-surface-variant">
        Leaderboards from recorded match winners
      </Text>

      {!hasContent ? (
        <Text variant="bodyMedium" className="mt-3 text-on-surface-variant">
          No winners recorded yet. Commit games on Select, then set winners in Match history.
        </Text>
      ) : (
        <ScrollView className="mt-4 flex-1" keyboardShouldPersistTaps="handled">
          {hasLeaderboards ? (
            <>
              <StatsSection
                title="Top civilizations"
                emptyMessage="No civilization wins recorded yet.">
                {topCivs.length > 0
                  ? topCivs.map((entry, index) => (
                      <View key={entry.civilizationKey} className={index > 0 ? 'mt-3' : 'mt-2'}>
                        <CivilizationLeaderboardCard entry={entry} rank={index + 1} />
                      </View>
                    ))
                  : null}
              </StatsSection>

              <Divider className="my-6 bg-outline" />

              <StatsSection
                title="Top players"
                emptyMessage="No player wins recorded yet.">
                {topPlayers.length > 0
                  ? topPlayers.map((entry, index) => (
                      <View
                        key={entry.kind === 'ai' ? 'ai' : entry.playerId}
                        className={index > 0 ? 'mt-3' : 'mt-2'}>
                        <PlayerLeaderboardCard entry={entry} rank={index + 1} />
                      </View>
                    ))
                  : null}
              </StatsSection>
            </>
          ) : null}

          {showGameLengthChart ? (
            <>
              {hasLeaderboards ? <Divider className="my-6 bg-outline" /> : null}
              <StatsSection
                title="Game length"
                emptyMessage="Record at least three matches to see game lengths.">
                <ImperialCard className="overflow-hidden">
                  <View className="p-4">
                    <Text variant="bodySmall" className="text-on-surface-variant">
                      Each point is one match, placed by how many days it lasted (start to end
                      date).
                    </Text>
                    <GameLengthAxisChart durations={gameDurations} />
                  </View>
                </ImperialCard>
              </StatsSection>
            </>
          ) : null}
        </ScrollView>
      )}
    </Screen>
  );
}
