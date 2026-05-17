import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/** Material Symbols–style utility icons (Material Icons outlined set in Expo). */
export type SymbolName = Extract<
  MaterialIconName,
  | 'menu-book'
  | 'military-tech'
  | 'history'
  | 'leaderboard'
  | 'chevron-left'
  | 'chevron-right'
  | 'expand-more'
  | 'expand-less'
>;

type IconSymbolProps = {
  name: SymbolName;
  size?: number;
  color: string;
};

export function IconSymbol({ name, size = 24, color }: IconSymbolProps) {
  return <MaterialIcons name={name} size={size} color={color} />;
}
