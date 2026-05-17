import { ThemeProvider } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import type { PropsWithChildren } from 'react';

import { imperialNavigationTheme } from '@/constants/navigationTheme';
import { imperialPaperTheme } from '@/constants/paperTheme';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <PaperProvider theme={imperialPaperTheme}>
      <ThemeProvider value={imperialNavigationTheme}>{children}</ThemeProvider>
    </PaperProvider>
  );
}
