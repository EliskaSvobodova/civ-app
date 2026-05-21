import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

import { imperialColors } from '@/constants/theme';

const HORIZONTAL_PADDING = 16;
const PLOT_TOP = 8;
const DOT_SIZE = 10;
const DOT_STACK_GAP = 4;
const AXIS_THICKNESS = 2;

type GameLengthAxisChartProps = {
  durations: number[];
};

function positionForDays(days: number, maxDays: number, innerWidth: number): number {
  if (innerWidth <= 0) {
    return HORIZONTAL_PADDING;
  }
  if (maxDays <= 0) {
    return HORIZONTAL_PADDING + innerWidth / 2;
  }
  return HORIZONTAL_PADDING + (days / maxDays) * innerWidth;
}

export function GameLengthAxisChart({ durations }: GameLengthAxisChartProps) {
  const [chartWidth, setChartWidth] = useState(0);
  const maxDays = useMemo(() => Math.max(...durations, 1), [durations]);
  const innerWidth = Math.max(0, chartWidth - HORIZONTAL_PADDING * 2);

  const stackedOffsets = useMemo(() => {
    const seen = new Map<number, number>();
    return durations.map((days) => {
      const index = seen.get(days) ?? 0;
      seen.set(days, index + 1);
      return index;
    });
  }, [durations]);

  const tickValues = useMemo(() => {
    if (maxDays <= 1) {
      return [1];
    }
    const mid = Math.round(maxDays / 2);
    const ticks = [0, mid, maxDays];
    return [...new Set(ticks)].sort((a, b) => a - b);
  }, [maxDays]);

  const maxStack = Math.max(0, ...stackedOffsets);
  const axisY = PLOT_TOP + maxStack * (DOT_SIZE + DOT_STACK_GAP) + DOT_SIZE / 2;
  const plotHeight = axisY + DOT_SIZE / 2 + 4;

  return (
    <View
      className="mt-2"
      onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
      accessibilityLabel="Game length chart by days">
      <View style={{ height: plotHeight, width: '100%' }}>
        <View
          style={{
            position: 'absolute',
            left: HORIZONTAL_PADDING,
            right: HORIZONTAL_PADDING,
            top: axisY - AXIS_THICKNESS / 2,
            height: AXIS_THICKNESS,
            backgroundColor: imperialColors.primary,
          }}
        />
        {durations.map((days, index) => {
          const centerX = positionForDays(days, maxDays, innerWidth);
          const stackIndex = stackedOffsets[index];
          return (
            <View
              key={`${days}-${index}`}
              style={{
                position: 'absolute',
                left: centerX - DOT_SIZE / 2,
                top: axisY - DOT_SIZE / 2 - stackIndex * (DOT_SIZE + DOT_STACK_GAP),
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: DOT_SIZE / 2,
                backgroundColor: imperialColors.secondary,
                borderWidth: 1,
                borderColor: imperialColors.surface,
              }}
            />
          );
        })}
      </View>
      <View className="relative mt-1" style={{ height: 20 }}>
        {tickValues.map((value) => {
          const centerX = positionForDays(value, maxDays, innerWidth);
          return (
            <Text
              key={value}
              variant="labelSmall"
              className="absolute text-on-surface-variant"
              style={{
                left: centerX - 12,
                width: 24,
                textAlign: 'center',
              }}>
              {value}
            </Text>
          );
        })}
      </View>
      <Text variant="labelSmall" className="mt-1 text-center text-on-surface-variant">
        Days
      </Text>
    </View>
  );
}
