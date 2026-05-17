import { View } from 'react-native';
import { Text } from 'react-native-paper';

import { imperialFonts } from '@/constants/theme';
import { getCivilizationInitials } from '@/utils/civilization';

export function CivilizationEmblem({ name }: { name: string }) {
  const initials = getCivilizationInitials(name);

  return (
    <View
      className="h-10 w-10 items-center justify-center rounded-full border border-outline bg-surface-dim"
      accessibilityLabel={`${name} emblem`}>
      <Text
        className="text-[11px] text-primary"
        style={{ fontFamily: imperialFonts.serifSemiBold }}>
        {initials}
      </Text>
    </View>
  );
}
