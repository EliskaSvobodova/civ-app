import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import type { PropsWithChildren } from 'react';

export function AppProviders({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const paperTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>
    </PaperProvider>
  );
}
