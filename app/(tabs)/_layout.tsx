import { router, Tabs } from 'expo-router';
import { type ColorValue, Platform } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { imperialColors, imperialFonts } from '@/constants/theme';

function TabBarIcon({
  name,
  color,
}: {
  name: 'menu-book' | 'military-tech' | 'history' | 'leaderboard';
  color: ColorValue;
}) {
  return <IconSymbol name={name} size={24} color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarPosition: 'top',
        tabBarActiveTintColor: imperialColors.secondary,
        tabBarInactiveTintColor: imperialColors.muted,
        tabBarStyle: {
          backgroundColor: imperialColors.surface,
          borderBottomColor: imperialColors.outline,
          borderBottomWidth: 1,
          ...(Platform.OS === 'web'
            ? {
                borderBottomLeftRadius: 9999,
                borderBottomRightRadius: 9999,
              }
            : {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }),
          paddingBottom: 8,
          height: 64,
        },
        headerStyle: {
          backgroundColor: imperialColors.surface,
        },
        headerTintColor: imperialColors.primary,
        headerTitleStyle: {
          fontFamily: imperialFonts.serifBold,
          color: imperialColors.primary,
        },
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          tabBarIcon: ({ color }) => <TabBarIcon name="menu-book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="select"
        options={{
          title: 'Select',
          tabBarIcon: ({ color }) => <TabBarIcon name="military-tech" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
        }}
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.replace('/history');
          },
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="leaderboard" color={color} />,
        }}
      />
    </Tabs>
  );
}
