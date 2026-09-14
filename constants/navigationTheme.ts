import { DefaultTheme, type Theme } from "expo-router/react-navigation";

import { imperialColors, imperialFonts } from './theme';

export const imperialNavigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: imperialColors.secondary,
    background: imperialColors.surface,
    card: imperialColors.surface,
    text: imperialColors.primary,
    border: imperialColors.outline,
    notification: imperialColors.secondary,
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: imperialFonts.serifRegular,
      fontWeight: '400',
    },
    medium: {
      fontFamily: imperialFonts.serifSemiBold,
      fontWeight: '600',
    },
    bold: {
      fontFamily: imperialFonts.serifBold,
      fontWeight: '700',
    },
    heavy: {
      fontFamily: imperialFonts.serifBold,
      fontWeight: '700',
    },
  },
};
