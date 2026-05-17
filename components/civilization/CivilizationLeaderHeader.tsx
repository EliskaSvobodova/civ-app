import { Text, View } from 'react-native';

import { imperialFonts } from '@/constants/theme';
import type { Civilization } from '@/types';

export function CivilizationLeaderHeader({ civilization }: { civilization: Civilization }) {
  return (
    <View className="min-w-0 flex-1 shrink" collapsable={false}>
      <Text
        className="text-xs uppercase tracking-wider text-primary"
        style={{ fontFamily: imperialFonts.serifSemiBold }}>
        {civilization.leader.name}
      </Text>
      <Text
        className="mt-0.5 text-xl text-primary"
        style={{ fontFamily: imperialFonts.serifBold }}>
        {civilization.name}
      </Text>
    </View>
  );
}
