import { Platform, View } from 'react-native';

/** Low-opacity noise overlay for parchment cards (web uses SVG grain from global.css). */
export function ParchmentGrain() {
  if (Platform.OS === 'web') {
    return <View className="parchment-grain pointer-events-none absolute inset-0" />;
  }

  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 opacity-[0.035]"
      style={{ backgroundColor: 'rgba(0, 43, 91, 0.12)' }}
    />
  );
}
