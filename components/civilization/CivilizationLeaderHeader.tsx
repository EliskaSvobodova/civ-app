import { View } from 'react-native';
import { Text } from 'react-native-paper';

import { imperialFonts } from '@/constants/theme';
import type { Civilization } from '@/types';

export function CivilizationLeaderHeader({ civilization }: { civilization: Civilization }) {
  return (
    <View className="min-w-0 flex-1">
      <Text
        variant="labelSmall"
        className="uppercase tracking-wider text-primary"
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
