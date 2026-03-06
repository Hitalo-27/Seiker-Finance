import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
 light: {
    background: '#F5F7FA',      // Um cinza bem clarinho, mais moderno que o branco puro
    tint: tintColorLight,
    icon: '#64748B',            // Slate grey para ícones
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',            // Cards brancos para destacar do fundo
    primary: '#00ACC1',         // Ciano "vibrante mas legível"
    secondary: '#71717A',       // Texto secundário (cinza médio)
    text: '#121417',            // Quase preto para máximo contraste
    error: '#E53935',           // Vermelho um pouco mais fechado
    border: '#E2E8F0'           // Bordas sutis
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
    border: '#2C343B'
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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
