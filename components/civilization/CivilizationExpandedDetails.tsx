import { Pressable, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';

import { imperialColors } from '@/constants/theme';
import type { Civilization } from '@/types';
import { getCivilizationFlavor } from '@/utils/civilization';

function UniqueAssetColumn({
  title,
  items,
}: {
  title: string;
  items: { id: string; name: string }[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View className="min-w-0 flex-1">
      <Text variant="labelSmall" className="font-bold uppercase tracking-wide text-primary">
        {title}
      </Text>
      <View className="mt-2 gap-1">
        {items.map((item) => (
          <Text key={item.id} variant="bodySmall" className="text-on-surface-variant">
            • {item.name}
          </Text>
        ))}
      </View>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outlined';
}) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`flex-1 rounded-md py-3 active:opacity-90 ${
        isPrimary ? 'bg-primary' : 'border border-primary bg-surface'
      }`}>
      <Text
        variant="labelLarge"
        className="text-center font-semibold uppercase tracking-wide"
        style={{ color: isPrimary ? imperialColors.onPrimary : imperialColors.primary }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function CivilizationExpandedDetails({
  civilization,
  onViewDetails,
  onViewHistory,
}: {
  civilization: Civilization;
  onViewDetails?: () => void;
  onViewHistory?: () => void;
}) {
  const flavor = getCivilizationFlavor(civilization);
  const buildings = civilization.uniqueBuildings ?? [];
  const hasUniqueAssets = civilization.uniqueUnits.length > 0 || buildings.length > 0;

  return (
    <View className="gap-4">
      {flavor ? (
        <Text variant="bodyMedium" className="italic text-on-surface-variant">
          {flavor}
        </Text>
      ) : null}

      <Divider className="bg-outline" />

      <View>
        <Text variant="labelMedium" className="font-bold uppercase tracking-wide text-primary">
          {civilization.uniqueAbility.name}
        </Text>
        <Text variant="bodyMedium" className="mt-1 text-on-surface-variant">
          {civilization.uniqueAbility.description}
        </Text>
      </View>

      {hasUniqueAssets ? (
        <View className="flex-row gap-4">
          <UniqueAssetColumn title="Unique units" items={civilization.uniqueUnits} />
          <UniqueAssetColumn title="Unique buildings" items={buildings} />
        </View>
      ) : null}

      {civilization.uniqueWonders && civilization.uniqueWonders.length > 0 ? (
        <View>
          <Text variant="labelSmall" className="font-bold uppercase tracking-wide text-primary">
            Unique wonders
          </Text>
          <View className="mt-2 gap-1">
            {civilization.uniqueWonders.map((wonder) => (
              <Text key={wonder.id} variant="bodySmall" className="text-on-surface-variant">
                • {wonder.name}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      {onViewDetails || onViewHistory ? (
        <View className="mt-1 flex-row gap-2">
          {onViewDetails ? (
            <ActionButton label="Details" onPress={onViewDetails} variant="outlined" />
          ) : null}
          {onViewHistory ? (
            <ActionButton label="View game history" onPress={onViewHistory} variant="primary" />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
