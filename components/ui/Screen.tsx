import { View, type ViewProps } from 'react-native';

type ScreenProps = ViewProps & {
  className?: string;
};

export function Screen({ className, children, ...props }: ScreenProps) {
  return (
    <View className={`flex-1 bg-surface ${className ?? ''}`} {...props}>
      {children}
    </View>
  );
}
