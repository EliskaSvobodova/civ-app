import { View, type ViewProps } from 'react-native';

import { ParchmentGrain } from './ParchmentGrain';

type ImperialCardProps = ViewProps & {
  className?: string;
  selected?: boolean;
};

export function ImperialCard({
  className,
  selected = false,
  children,
  ...props
}: ImperialCardProps) {
  const stateClass = selected
    ? 'border-l-4 border-l-secondary shadow-md'
    : 'shadow-sm';

  return (
    <View
      className={`relative rounded-md border border-outline bg-surface ${stateClass} ${className ?? ''}`}
      {...props}>
      <View className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
        <ParchmentGrain />
      </View>
      <View className="relative">{children}</View>
    </View>
  );
}
