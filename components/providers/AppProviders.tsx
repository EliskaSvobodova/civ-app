import { ThemeProvider } from '@react-navigation/native';
import type { PropsWithChildren } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { imperialNavigationTheme } from '@/constants/navigationTheme';
import { imperialPaperTheme } from '@/constants/paperTheme';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={imperialPaperTheme}>
        <ThemeProvider value={imperialNavigationTheme}>{children}</ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
