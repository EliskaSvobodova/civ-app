import { useIsFocused } from "expo-router/react-navigation";
import { Platform, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = ViewProps & {
  className?: string;
};

export function Screen({ className, children, ...props }: ScreenProps) {
  const isFocused = useIsFocused();

  // Inactive tab screens stay mounted on web and can block clicks on the active tab.
  if (Platform.OS === 'web' && !isFocused) {
    return null;
  }

  const screenClassName = `flex-1 bg-surface ${className ?? ''}`;

  if (Platform.OS === 'web') {
    return (
      <View className={screenClassName} {...props}>
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} className={screenClassName} {...props}>
      {children}
    </SafeAreaView>
  );
}
