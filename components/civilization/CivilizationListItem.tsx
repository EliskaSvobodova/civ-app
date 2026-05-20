import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { ImperialCard } from '@/components/ui/ImperialCard';
import { imperialColors } from '@/constants/theme';
import type { Civilization } from '@/types';

import { CivilizationDetailsModal } from './CivilizationDetailsModal';
import { CivilizationEmblem } from './CivilizationEmblem';
import { CivilizationExpandedDetails } from './CivilizationExpandedDetails';
import { CivilizationLeaderHeader } from './CivilizationLeaderHeader';

export function CivilizationListItem({ civilization }: { civilization: Civilization }) {
  const [expanded, setExpanded] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);

  return (
    <ImperialCard className="mb-3" selected={expanded}>
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="p-4"
        style={Platform.OS === 'web' ? { cursor: 'pointer' } : undefined}>
        <View className="flex-row items-start gap-2">
          <CivilizationLeaderHeader civilization={civilization} />
          <CivilizationEmblem name={civilization.name} />
          <IconSymbol
            name={expanded ? 'expand-less' : 'expand-more'}
            size={24}
            color={imperialColors.primary}
          />
        </View>
      </Pressable>

      {expanded ? (
        <View className="border-t border-outline px-4 pb-6 pt-4">
          <CivilizationExpandedDetails
            civilization={civilization}
            onViewDetails={() => setDetailsVisible(true)}
            onViewHistory={() =>
              router.push({
                pathname: '/history',
                params: { civ: civilization.slug },
              })
            }
          />
        </View>
      ) : null}

      <CivilizationDetailsModal
        civilization={civilization}
        visible={detailsVisible}
        onDismiss={() => setDetailsVisible(false)}
      />
    </ImperialCard>
  );
}
