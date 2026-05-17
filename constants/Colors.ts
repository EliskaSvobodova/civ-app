import { imperialColors } from './theme';

const tintColorLight = imperialColors.secondary;
const tintColorDark = imperialColors.secondary;

export default {
  light: {
    text: imperialColors.primary,
    background: imperialColors.surface,
    tint: tintColorLight,
    tabIconDefault: imperialColors.muted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: imperialColors.surface,
    background: imperialColors.primary,
    tint: tintColorDark,
    tabIconDefault: 'rgba(255, 248, 245, 0.5)',
    tabIconSelected: tintColorDark,
  },
};
