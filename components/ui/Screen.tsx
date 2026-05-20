import { useIsFocused } from '@react-navigation/native';
import { Platform, View, type ViewProps } from 'react-native';

type ScreenProps = ViewProps & {
  className?: string;
};

export function Screen({ className, children, ...props }: ScreenProps) {
  const isFocused = useIsFocused();

  // Inactive tab screens stay mounted on web and can block clicks on the active tab.
  if (Platform.OS === 'web' && !isFocused) {
    return null;
  }

  return (
    <View className={`flex-1 bg-surface ${className ?? ''}`} {...props}>
      {children}
    </View>
  );
}
