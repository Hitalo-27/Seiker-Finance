import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Target, Wallet, TrendingUp, TrendingDown } from 'lucide-react-native';
import { ICON_LIST, getThemeColor } from '../constants/icons';
import { Category } from '../types/budget';

const formatCurrency = (value: number) => {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

interface Props {
  cat: Category;
  theme: any;
  themeMode: string;
  onPress: () => void;
}

export function CategoryCard({ cat, theme, themeMode, onPress }: Props) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const IconComp = ICON_LIST.find((i) => i.name === cat.icon)?.lib || Target;
  const color = getThemeColor(cat.color || theme.text, themeMode);

  const isInvestment = cat.categoryType === "investment";
  const isIncome = cat.categoryType === "income";
  const TypeIcon = isIncome ? Wallet : isInvestment ? TrendingUp : TrendingDown;

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: color }]}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <IconComp color={color} size={20} />
        <View style={styles.iconRow}>
          {cat.installmentLabel && (
            <Text style={{ color: color, fontSize: 10, fontWeight: "bold" }}>
              {cat.installmentLabel}
            </Text>
          )}
          <TypeIcon color={color} size={14} />
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {cat.name}
      </Text>
      <Text style={[styles.cardValue, { color: color }]}>
        {formatCurrency(cat.value || 0)}
      </Text>
    </TouchableOpacity>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    width: "48%",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    position: "relative",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4 
  },
  cardTitle: { color: theme.secondary, fontSize: 11 },
  cardValue: { fontSize: 15, fontWeight: "bold" },
});
