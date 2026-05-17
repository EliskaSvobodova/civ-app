import { Text, type TextProps } from 'react-native';

import { imperialFonts } from '@/constants/theme';

type HeadingLevel = 'lg' | 'md' | 'sm';

const levelClass: Record<HeadingLevel, string> = {
  lg: 'text-3xl',
  md: 'text-2xl',
  sm: 'text-xl',
};

type HeadingProps = TextProps & {
  className?: string;
  level?: HeadingLevel;
};

export function Heading({ className, level = 'md', style, ...props }: HeadingProps) {
  return (
    <Text
      className={`text-primary ${levelClass[level]} ${className ?? ''}`}
      style={[{ fontFamily: imperialFonts.serifBold }, style]}
      {...props}
    />
  );
}
