import { router, Tabs } from 'expo-router';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { imperialColors, imperialFonts } from '@/constants/theme';

function TabBarIcon({
  name,
  color,
}: {
  name: 'menu-book' | 'military-tech' | 'history' | 'leaderboard';
  color: string;
}) {
  return <IconSymbol name={name} size={24} color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: imperialColors.secondary,
        tabBarInactiveTintColor: imperialColors.muted,
        tabBarStyle: {
          backgroundColor: imperialColors.surface,
          borderTopColor: imperialColors.outline,
          borderTopWidth: 1,
          borderTopLeftRadius: 9999,
          borderTopRightRadius: 9999,
          paddingTop: 8,
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
