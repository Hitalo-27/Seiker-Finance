import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Target, Wallet, TrendingUp, TrendingDown } from "lucide-react-native";
import { ICON_LIST, getThemeColor } from "../constants/icons";
import { Category } from "../types/budget";

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
  const isDark = themeMode === "dark";
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const IconComp = ICON_LIST.find((i) => i.name === cat.icon)?.lib || Target;
  const color = getThemeColor(
    cat.color || theme.text,
    themeMode as "dark" | "light"
  );

  const isInvestment = cat.categoryType === "investment";
  const isIncome = cat.categoryType === "income";
  const TypeIcon = isIncome ? Wallet : isInvestment ? TrendingUp : TrendingDown;
  const typeLabel = isIncome
    ? "Entrada"
    : isInvestment
      ? "Invest."
      : "Despesa";

  const gradientColors: [string, string] = isDark
    ? [color + "22", theme.card]
    : [color + "18", theme.card];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.cardWrapper,
        {
          borderColor: isDark ? color + "55" : color + "44",
          shadowColor: color,
        },
      ]}
      onPress={onPress}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View
          style={[
            styles.decorativeCircle,
            { backgroundColor: color + (isDark ? "14" : "12") },
          ]}
        />

        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: color + (isDark ? "28" : "20"),
                borderColor: color + "40",
              },
            ]}
          >
            <IconComp color={color} size={18} />
          </View>

          <View style={styles.rightBadges}>
            {cat.installmentLabel && (
              <View
                style={[
                  styles.installmentPill,
                  {
                    backgroundColor: color + (isDark ? "30" : "22"),
                    borderColor: color + "55",
                  },
                ]}
              >
                <Text style={[styles.installmentText, { color }]}>
                  {cat.installmentLabel}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                },
              ]}
            >
              <TypeIcon color={color} size={12} />
            </View>
          </View>
        </View>

        <View style={styles.cardMetaRow}>
          <View style={[styles.miniChip, { borderColor: color + "55" }]}>
            <View
              style={[styles.miniChipLine, { backgroundColor: color + "66" }]}
            />
          </View>
          <Text style={styles.cardTypeLabel}>{typeLabel}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {cat.name}
          </Text>
          <Text style={[styles.cardValue, { color }]} numberOfLines={1}>
            {formatCurrency(cat.value || 0)}
          </Text>
        </View>

        <View style={[styles.accentBar, { backgroundColor: color }]} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    cardWrapper: {
      width: "48%",
      borderRadius: 20,
      borderWidth: 1,
      overflow: "hidden",
      backgroundColor: theme.card,
      elevation: 4,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.25 : 0.12,
      shadowRadius: 8,
    },
    cardGradient: {
      padding: 15,
      minHeight: 128,
      justifyContent: "space-between",
      position: "relative",
      overflow: "hidden",
    },
    decorativeCircle: {
      position: "absolute",
      width: 95,
      height: 95,
      borderRadius: 48,
      right: -28,
      bottom: -28,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    rightBadges: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    installmentPill: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
    },
    installmentText: {
      fontSize: 10,
      fontWeight: "800",
    },
    typeBadge: {
      width: 24,
      height: 24,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    cardMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginVertical: 8,
    },
    miniChip: {
      width: 18,
      height: 13,
      borderRadius: 3.5,
      borderWidth: 1,
      backgroundColor: isDark
        ? "rgba(255, 215, 0, 0.12)"
        : "rgba(218, 165, 32, 0.15)",
      justifyContent: "center",
      alignItems: "center",
    },
    miniChipLine: {
      width: "70%",
      height: 1,
    },
    cardTypeLabel: {
      color: theme.secondary,
      fontSize: 9,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    footer: {
      gap: 2,
    },
    cardTitle: {
      color: theme.secondary,
      fontSize: 12,
      fontWeight: "600",
    },
    cardValue: {
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    accentBar: {
      position: "absolute",
      left: 0,
      top: 18,
      bottom: 18,
      width: 3.5,
      borderTopRightRadius: 4,
      borderBottomRightRadius: 4,
    },
  });

