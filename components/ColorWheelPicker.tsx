import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, Palette, Sun } from 'lucide-react-native';

interface ColorWheelPickerProps {
  color: string;
  onColorChange: (hex: string) => void;
  theme: any;
  size?: number;
}

export function hsvToHex(h: number, s: number, v: number): string {
  const normH = ((h % 360) + 360) % 360;
  const normS = Math.max(0, Math.min(100, s)) / 100;
  const normV = Math.max(0, Math.min(100, v)) / 100;

  const c = normV * normS;
  const x = c * (1 - Math.abs(((normH / 60) % 2) - 1));
  const m = normV - c;

  let r = 0;
  let g = 0;
  let b = 0;

  if (normH >= 0 && normH < 60) {
    r = c; g = x; b = 0;
  } else if (normH >= 60 && normH < 120) {
    r = x; g = c; b = 0;
  } else if (normH >= 120 && normH < 180) {
    r = 0; g = c; b = x;
  } else if (normH >= 180 && normH < 240) {
    r = 0; g = x; b = c;
  } else if (normH >= 240 && normH < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (val: number) =>
    Math.round((val + m) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  let clean = (hex || '#00F5FF').replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  if (clean.length !== 6) {
    return { h: 182, s: 100, v: 100 };
  }

  const num = parseInt(clean, 16);
  if (isNaN(num)) {
    return { h: 182, s: 100, v: 100 };
  }

  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function createPieWedgePath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', cx, cy,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z',
  ].join(' ');
}

export function ColorWheelPicker({
  color,
  onColorChange,
  theme,
  size = 230,
}: ColorWheelPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [hsv, setHsv] = useState<{ h: number; s: number; v: number }>(() =>
    hexToHsv(color)
  );
  const [sliderWidth, setSliderWidth] = useState(230);

  const center = size / 2;
  const wheelRadius = size / 2 - 14;

  // Fatias do círculo cromático preenchido
  const wedges = useMemo(() => {
    const count = 90;
    const step = 360 / count;
    const list = [];
    for (let i = 0; i < count; i++) {
      const startAngle = i * step;
      const endAngle = (i + 1) * step + 0.9;
      list.push({
        key: i,
        d: createPieWedgePath(center, center, wheelRadius, startAngle, endAngle),
        fill: hsvToHex(startAngle, 100, 100),
      });
    }
    return list;
  }, [center, wheelRadius]);

  const wheelGrantRef = useRef({ pageX: 0, pageY: 0, locX: center, locY: center });
  const sliderGrantRef = useRef({ pageX: 0, locX: 0 });

  const updateWheelFromPoint = (x: number, y: number) => {
    const dx = x - center;
    const dy = y - center;
    const dist = Math.min(wheelRadius, Math.hypot(dx, dy));
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    const nextH = Math.round(angle) % 360;
    const nextS = Math.round((dist / wheelRadius) * 100);
    setHsv((prev) => ({ h: nextH, s: nextS, v: prev.v }));
  };

  const handleWheelGrant = (evt: GestureResponderEvent) => {
    const { locationX, locationY, pageX, pageY } = evt.nativeEvent;
    wheelGrantRef.current = { pageX, pageY, locX: locationX, locY: locationY };
    updateWheelFromPoint(locationX, locationY);
  };

  const handleWheelMove = (evt: GestureResponderEvent) => {
    const { pageX, pageY } = evt.nativeEvent;
    const x = wheelGrantRef.current.locX + (pageX - wheelGrantRef.current.pageX);
    const y = wheelGrantRef.current.locY + (pageY - wheelGrantRef.current.pageY);
    updateWheelFromPoint(x, y);
  };

  const updateBrightnessFromX = (x: number) => {
    const width = Math.max(1, sliderWidth);
    const clampedX = Math.max(0, Math.min(width, x));
    const nextV = Math.max(5, Math.round((clampedX / width) * 100));
    setHsv((prev) => ({ ...prev, v: nextV }));
  };

  const handleSliderGrant = (evt: GestureResponderEvent) => {
    const { locationX, pageX } = evt.nativeEvent;
    sliderGrantRef.current = { pageX, locX: locationX };
    updateBrightnessFromX(locationX);
  };

  const handleSliderMove = (evt: GestureResponderEvent) => {
    const { pageX } = evt.nativeEvent;
    const x = sliderGrantRef.current.locX + (pageX - sliderGrantRef.current.pageX);
    updateBrightnessFromX(x);
  };

  const openPickerModal = () => {
    setHsv(hexToHsv(color));
    setModalVisible(true);
  };

  const selectedHex = hsvToHex(hsv.h, hsv.s, hsv.v);
  const fullBrightnessHex = hsvToHex(hsv.h, hsv.s, 100);
  const displayColor = color || '#00F5FF';

  // Posição 2D da bolinha dentro do círculo (ângulo = matiz, distância do centro = saturação)
  const thumbDist = (hsv.s / 100) * wheelRadius;
  const thumbPos = polarToCartesian(center, center, thumbDist, hsv.h);

  const handleConfirm = () => {
    onColorChange(selectedHex);
    setModalVisible(false);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[
          styles.triggerButton,
          { backgroundColor: theme.background, borderColor: theme.border },
        ]}
        activeOpacity={0.8}
        onPress={openPickerModal}
      >
        <View style={styles.triggerLeft}>
          <View
            style={[
              styles.triggerColorPreview,
              { backgroundColor: displayColor, borderColor: theme.text },
            ]}
          />
          <View>
            <Text style={[styles.triggerTitle, { color: theme.text }]}>
              Cor da Categoria
            </Text>
            <Text style={[styles.triggerSubtitle, { color: theme.secondary }]}>
              Toque para selecionar
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.paletteBadge,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Palette size={18} color={displayColor} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.pickerCard,
              { backgroundColor: theme.card, borderColor: theme.primary },
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: theme.text }]}>
                Escolha a cor
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={theme.text} size={22} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.helperText, { color: theme.secondary }]}>
              Arraste a bolinha para qualquer ponto do círculo e ajuste o tom abaixo
            </Text>

            <View style={styles.wheelContainer}>
              <View
                style={{ width: size, height: size }}
                onStartShouldSetResponder={() => true}
                onStartShouldSetResponderCapture={() => true}
                onMoveShouldSetResponder={() => true}
                onMoveShouldSetResponderCapture={() => true}
                onResponderTerminationRequest={() => false}
                onResponderGrant={handleWheelGrant}
                onResponderMove={handleWheelMove}
              >
                <View pointerEvents="none" style={{ width: size, height: size }}>
                  <Svg width={size} height={size}>
                    <Defs>
                      <RadialGradient id="whiteSatGrad" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                      </RadialGradient>
                    </Defs>

                    {wedges.map((w) => (
                      <Path key={w.key} d={w.d} fill={w.fill} />
                    ))}

                    <Circle
                      cx={center}
                      cy={center}
                      r={wheelRadius}
                      fill="url(#whiteSatGrad)"
                    />

                    <Circle
                      cx={center}
                      cy={center}
                      r={wheelRadius}
                      fill="#000000"
                      fillOpacity={1 - hsv.v / 100}
                    />

                    <Circle
                      cx={center}
                      cy={center}
                      r={wheelRadius}
                      fill="none"
                      stroke={theme.border}
                      strokeWidth={1.5}
                    />

                    <Circle
                      cx={thumbPos.x}
                      cy={thumbPos.y}
                      r={13}
                      fill={selectedHex}
                      stroke="#FFFFFF"
                      strokeWidth={3}
                    />
                    <Circle
                      cx={thumbPos.x}
                      cy={thumbPos.y}
                      r={14.5}
                      fill="none"
                      stroke="rgba(0,0,0,0.45)"
                      strokeWidth={1}
                    />
                  </Svg>
                </View>
              </View>
            </View>

            <View style={styles.sliderSection}>
              <View style={styles.sliderHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sun size={14} color={theme.secondary} />
                  <Text style={[styles.sliderLabel, { color: theme.secondary }]}>
                    Tom / Brilho
                  </Text>
                </View>
                <Text style={[styles.sliderValueText, { color: theme.text }]}>
                  {hsv.v}%
                </Text>
              </View>

              <View
                style={styles.sliderTouchArea}
                onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
                onStartShouldSetResponder={() => true}
                onStartShouldSetResponderCapture={() => true}
                onMoveShouldSetResponder={() => true}
                onMoveShouldSetResponderCapture={() => true}
                onResponderTerminationRequest={() => false}
                onResponderGrant={handleSliderGrant}
                onResponderMove={handleSliderMove}
              >
                <View pointerEvents="none" style={styles.sliderTrackWrapper}>
                  <LinearGradient
                    colors={['#000000', fullBrightnessHex]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[styles.sliderTrack, { borderColor: theme.border }]}
                  />
                  <View
                    style={[
                      styles.sliderThumb,
                      {
                        left: Math.max(
                          0,
                          Math.min(sliderWidth - 24, (hsv.v / 100) * sliderWidth - 12)
                        ),
                        backgroundColor: selectedHex,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            <View
              style={[
                styles.previewRow,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.previewSwatch,
                  { backgroundColor: selectedHex, borderColor: theme.border },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.previewLabel, { color: theme.secondary }]}>
                  COR SELECIONADA
                </Text>
                <Text style={[styles.previewHex, { color: theme.text }]}>
                  {selectedHex}
                </Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: theme.border, backgroundColor: theme.background },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.secondary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: theme.primary }]}
                onPress={handleConfirm}
              >
                <Check size={18} color={theme.background} />
                <Text style={[styles.confirmButtonText, { color: theme.background }]}>
                  Aplicar Cor
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 15,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  triggerColorPreview: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
  },
  triggerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  triggerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  paletteBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 16,
  },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  sliderSection: {
    marginTop: 14,
  },
  sliderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sliderValueText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sliderTouchArea: {
    height: 32,
    justifyContent: 'center',
  },
  sliderTrackWrapper: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    width: '100%',
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    gap: 12,
  },
  previewSwatch: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  previewHex: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  confirmButton: {
    flex: 1.4,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});
