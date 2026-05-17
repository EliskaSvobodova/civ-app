import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

import { imperialColors } from './theme';

export const imperialPaperTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 6,
  colors: {
    ...MD3LightTheme.colors,
    primary: imperialColors.secondary,
    onPrimary: imperialColors.primary,
    primaryContainer: '#e8dcc4',
    onPrimaryContainer: imperialColors.primary,
    secondary: imperialColors.primary,
    onSecondary: imperialColors.surface,
    secondaryContainer: '#d4e4f7',
    onSecondaryContainer: imperialColors.primary,
    background: imperialColors.surface,
    onBackground: imperialColors.primary,
    surface: imperialColors.surface,
    onSurface: imperialColors.primary,
    surfaceVariant: imperialColors.surfaceDim,
    onSurfaceVariant: imperialColors.muted,
    outline: imperialColors.outline,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: imperialColors.surface,
      level2: imperialColors.surfaceDim,
    },
  },
};
