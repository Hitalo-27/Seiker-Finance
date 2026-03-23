import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
 light: {
    background: '#F5F7FA',
    tint: tintColorLight,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    primary: '#00ACC1',
    secondary: '#71717A',
    text: '#121417',
    error: '#E53935',
    errorGradient: '#7B1212',
    border: '#E2E8F0',
    success: '#4ade80',
    successGradient: '#065f46',
    warning : '#FFB800',
    warningGradient: '#7A5900',
  },
  dark: {
    background: '#0B0E11',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    card: '#1B2126',
    primary: '#00F5FF',
    secondary: '#8B949E',
    text: '#FFFFFF',
    error: '#FF5252',
    errorGradient: '#7B1212',
    border: '#2C343B',
    success: '#4ade80',
    successGradient: '#065f46',
    warning : '#FFB800',
    warningGradient: '#7A5900',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
