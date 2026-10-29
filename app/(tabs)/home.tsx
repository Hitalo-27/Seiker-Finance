import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Wifi, TrendingUp, TrendingDown, Plus, CreditCard } from "lucide-react-native";

import { useMonth } from "@/context/MonthContext";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "../../constants/theme";

import { useBudget } from "../../hooks/useBudget";
import { CategoryCard } from "../../components/CategoryCard";
import { TransactionModal } from "../../components/TransactionModal";
import { Category, RepeatMode } from "../../types/budget";

const formatCurrency = (value: number) => {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export default function Home() {
  const { selectedMonthId, setSelectedMonthId } = useMonth();
  const { theme: themeMode } = useTheme();
  const isDark = themeMode === "dark";
  const theme = Colors[themeMode as keyof typeof Colors];
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { budget, loading, isSaving, saveTransaction, deleteTransaction } = useBudget(selectedMonthId);

  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);

  const offset = useSharedValue(0);
  const opacity = useSharedValue(1);

  const openEditModal = (item: Category, isNew: boolean) => {
    setEditItem(item);
    setIsNewCategory(isNew);
    setModalVisible(true);
  };

  const changeMonth = (direction: number) => {
    opacity.value = 0;
    const [y, m] = selectedMonthId.split("-").map(Number);
    const d = new Date(y, m - 1 + direction, 1);
    setTimeout(() => {
      setSelectedMonthId(d.toISOString().slice(0, 7));
      offset.value = direction * 50;
      opacity.value = withTiming(1, { duration: 400 });
      offset.value = withSpring(0);
    }, 50);
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onUpdate((e) => {
      offset.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > 100) runOnJS(changeMonth)(-1);
      else if (e.translationX < -100) runOnJS(changeMonth)(1);
      else offset.value = withSpring(0);
    });

  const animatedContentStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: offset.value }],
    opacity: opacity.value,
  }));

  const handleSave = async (item: Category, repeatMode: RepeatMode, newMonths: number) => {
    await saveTransaction(item, repeatMode, newMonths, isNewCategory);
    setModalVisible(false);
  };

  const handleDelete = async (item: Category) => {
    await deleteTransaction(item);
    setModalVisible(false);
  };

  const totalIncome =
    budget?.categories
      ?.filter((c) => c.categoryType === "income")
      .reduce((acc, cat) => acc + (cat.value || 0), 0) || 0;
  const totalExpenses =
    budget?.categories
      ?.filter((c) => c.categoryType !== "income")
      .reduce((acc, cat) => acc + (cat.value || 0), 0) || 0;
  const remaining = totalIncome - totalExpenses;
  const isNegative = remaining < 0;
  const accentColor = isNegative ? theme.error : theme.primary;

  const mainCardGradient: [string, string, string] = isNegative
    ? isDark
      ? ["#3A1216", "#221215", theme.card]
      : ["#FFE5E5", "#FFF5F5", theme.card]
    : isDark
      ? ["#0E2F38", "#152229", theme.card]
      : ["#E0F7FA", "#F2FCFD", theme.card];

  const sortedCategories = useMemo(() => {
    if (!budget?.categories) return [];
    return [...budget.categories].sort((a, b) => {
      if (a.categoryType === "income" && b.categoryType !== "income") return -1;
      if (a.categoryType !== "income" && b.categoryType === "income") return 1;
      return 0;
    });
  }, [budget?.categories]);

  const formattedCardDate = useMemo(() => {
    const [year, month] = selectedMonthId.split("-");
    return `${month}/${year.slice(2)}`;
  }, [selectedMonthId]);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={animatedContentStyle}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator color={theme.primary} size="large" style={{ marginTop: 50 }} />
            ) : (
              <>
                <View
                  style={[
                    styles.mainCardWrapper,
                    {
                      borderColor: accentColor + (isDark ? "66" : "55"),
                      shadowColor: accentColor,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={mainCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.mainCard}
                  >
                    <View
                      style={[
                        styles.cardCircleLarge,
                        { backgroundColor: accentColor + (isDark ? "14" : "18") },
                      ]}
                    />
                    <View
                      style={[
                        styles.cardCircleSmall,
                        { backgroundColor: accentColor + (isDark ? "0D" : "12") },
                      ]}
                    />

                    <View style={styles.cardTopRow}>
                      <View style={styles.cardBrandRow}>
                        <View style={styles.emvChip}>
                          <View style={styles.emvChipLineH} />
                          <View style={styles.emvChipLineV} />
                        </View>
                        <Wifi
                          size={18}
                          color={theme.secondary}
                          style={{ transform: [{ rotate: "90deg" }], opacity: 0.75 }}
                        />
                      </View>
                      <View
                        style={[
                          styles.cardBadge,
                          {
                            backgroundColor: accentColor + (isDark ? "22" : "1A"),
                            borderColor: accentColor + "44",
                          },
                        ]}
                      >
                        <CreditCard size={12} color={accentColor} />
                        <Text style={[styles.cardBadgeText, { color: accentColor }]}>
                          SEIKER CARD
                        </Text>
                      </View>
                    </View>

                    <View style={styles.balanceSection}>
                      <Text style={styles.label}>VALOR DISPONÍVEL</Text>
                      <Text
                        style={[
                          styles.balanceValue,
                          { color: accentColor },
                        ]}
                      >
                        {formatCurrency(remaining)}
                      </Text>
                      <View style={styles.cardNumberRow}>
                        <Text style={styles.cardDots}>••••  ••••  ••••</Text>
                        <Text style={styles.cardValidity}>{formattedCardDate}</Text>
                      </View>
                    </View>

                    {/* Rodapé do Cartão: Ganhos e Gastos */}
                    <View style={styles.statsRow}>
                      <View style={styles.statBox}>
                        <View
                          style={[
                            styles.statIconWrap,
                            { backgroundColor: theme.success + "22" },
                          ]}
                        >
                          <TrendingUp size={14} color={theme.success} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.statLabel}>Ganhos</Text>
                          <Text
                            style={[styles.statValue, { color: theme.success }]}
                            numberOfLines={1}
                          >
                            {formatCurrency(totalIncome)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.statDivider} />

                      <View style={styles.statBox}>
                        <View
                          style={[
                            styles.statIconWrap,
                            { backgroundColor: theme.error + "22" },
                          ]}
                        >
                          <TrendingDown size={14} color={theme.error} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.statLabel}>Gastos</Text>
                          <Text
                            style={[styles.statValue, { color: theme.error }]}
                            numberOfLines={1}
                          >
                            {formatCurrency(totalExpenses)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                <View style={styles.grid}>
                  {sortedCategories.map((cat) => (
                    <CategoryCard
                      key={cat.id}
                      cat={cat}
                      theme={theme}
                      themeMode={themeMode}
                      onPress={() => openEditModal(cat, false)}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.addButton}
                  onPress={() =>
                    openEditModal(
                      {
                        name: "",
                        value: 0,
                        color: theme.primary,
                        icon: "Target",
                        categoryType: "expense",
                      },
                      true
                    )
                  }
                >
                  <View
                    style={[
                      styles.addIconCircle,
                      { backgroundColor: theme.primary + "20" },
                    ]}
                  >
                    <Plus size={18} color={theme.primary} />
                  </View>
                  <Text style={styles.addButtonText}>Adicionar Novo Item</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </GestureDetector>

      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        initialItem={editItem}
        isNew={isNewCategory}
        theme={theme}
        themeMode={themeMode}
        isSaving={isSaving}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof Colors.light, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { padding: 20, paddingBottom: 100 },
    mainCardWrapper: {
      borderRadius: 26,
      borderWidth: 1.5,
      marginBottom: 24,
      overflow: "hidden",
      backgroundColor: theme.card,
      elevation: 8,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.18,
      shadowRadius: 14,
    },
    mainCard: {
      padding: 22,
      position: "relative",
      overflow: "hidden",
    },
    cardCircleLarge: {
      position: "absolute",
      width: 200,
      height: 200,
      borderRadius: 100,
      right: -60,
      top: -60,
    },
    cardCircleSmall: {
      position: "absolute",
      width: 130,
      height: 130,
      borderRadius: 65,
      left: -40,
      bottom: -40,
    },
    cardTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
    },
    cardBrandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    emvChip: {
      width: 38,
      height: 28,
      borderRadius: 6,
      backgroundColor: isDark ? "rgba(255, 200, 60, 0.22)" : "rgba(212, 160, 23, 0.25)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 215, 0, 0.55)" : "rgba(184, 134, 11, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
    },
    emvChipLineH: {
      position: "absolute",
      width: "100%",
      height: 1,
      backgroundColor: isDark ? "rgba(255, 215, 0, 0.4)" : "rgba(184, 134, 11, 0.4)",
    },
    emvChipLineV: {
      position: "absolute",
      height: "100%",
      width: 1,
      backgroundColor: isDark ? "rgba(255, 215, 0, 0.4)" : "rgba(184, 134, 11, 0.4)",
    },
    cardBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
    },
    cardBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
    },
    balanceSection: {
      marginBottom: 18,
    },
    label: {
      color: theme.secondary,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.4,
      marginBottom: 4,
    },
    balanceValue: {
      fontSize: 32,
      fontWeight: "900",
      letterSpacing: -0.5,
    },
    cardNumberRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
    },
    cardDots: {
      color: theme.secondary,
      fontSize: 12,
      letterSpacing: 2,
      opacity: 0.7,
    },
    cardValidity: {
      color: theme.secondary,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      opacity: 0.85,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(0, 0, 0, 0.28)" : "rgba(255, 255, 255, 0.7)",
      borderRadius: 16,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.06)",
    },
    statBox: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    statDivider: {
      width: 1,
      height: 28,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      marginHorizontal: 12,
    },
    statIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    statLabel: {
      color: theme.secondary,
      fontSize: 10,
      fontWeight: "600",
    },
    statValue: {
      fontSize: 13,
      fontWeight: "800",
      marginTop: 1,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      justifyContent: "space-between",
    },
    addButton: {
      marginTop: 24,
      padding: 16,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
      borderWidth: 1.5,
      borderColor: theme.primary + "88",
      borderRadius: 18,
      borderStyle: "dashed",
      backgroundColor: isDark ? "rgba(0, 245, 255, 0.04)" : "rgba(0, 172, 193, 0.04)",
    },
    addIconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    addButtonText: {
      color: theme.primary,
      fontWeight: "700",
      fontSize: 14,
    },
  });

