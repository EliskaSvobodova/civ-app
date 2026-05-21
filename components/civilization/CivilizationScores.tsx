import { View } from 'react-native';
import { Text } from 'react-native-paper';

import { imperialColors } from '@/constants/theme';
import type { Civilization } from '@/types';

type ScoreKey = 'warlikeScore' | 'scienceScore' | 'cultureScore' | 'diplomaticScore';

const SCORE_ROWS: { key: ScoreKey; label: string }[] = [
  { key: 'warlikeScore', label: 'Warlike' },
  { key: 'scienceScore', label: 'Science' },
  { key: 'cultureScore', label: 'Culture' },
  { key: 'diplomaticScore', label: 'Diplomacy' },
];

function ScoreRow({ label, score }: { label: string; score: number }) {
  const fillPercent = Math.min(100, Math.max(0, (score / 10) * 100));

  return (
    <View className="flex-row items-center gap-3">
      <Text
        variant="labelSmall"
        className="w-[4.5rem] font-semibold uppercase tracking-wide text-on-surface-variant">
        {label}
      </Text>
      <View className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-dim">
        <View
          className="h-full rounded-full bg-primary"
          style={{ width: `${fillPercent}%` }}
        />
      </View>
      <Text
        variant="labelSmall"
        className="w-7 text-right font-semibold tabular-nums text-primary">
        {score}
      </Text>
    </View>
  );
}

export function CivilizationScores({ civilization }: { civilization: Civilization }) {
  return (
    <View className="gap-3">
      <Text variant="labelSmall" className="font-bold uppercase tracking-wide text-primary">
        Capabilities
      </Text>
      <View className="gap-2.5">
        {SCORE_ROWS.map(({ key, label }) => (
          <ScoreRow key={key} label={label} score={civilization[key]} />
        ))}
      </View>
      <Text variant="bodySmall" style={{ color: imperialColors.muted }}>
        Rated 0–10 from uniques and Vox Populi balance text
      </Text>
    </View>
  );
}
