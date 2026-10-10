import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from "react-native-reanimated";

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
  const theme = Colors[themeMode as keyof typeof Colors];
  const styles = useMemo(() => createStyles(theme), [theme]);

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

  const sortedCategories = useMemo(() => {
    if (!budget?.categories) return [];
    return [...budget.categories].sort((a, b) => {
      if (a.categoryType === "income" && b.categoryType !== "income") return -1;
      if (a.categoryType !== "income" && b.categoryType === "income") return 1;
      return 0;
    });
  }, [budget?.categories]);

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
                    styles.mainCard,
                    { borderColor: remaining < 0 ? theme.error : theme.primary },
                  ]}
                >
                  <Text style={styles.label}>Valor Disponível</Text>
                  <Text
                    style={[
                      styles.balanceValue,
                      { color: remaining < 0 ? theme.error : theme.primary },
                    ]}
                  >
                    {formatCurrency(remaining)}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 20, marginTop: 10 }}>
                    <Text style={{ color: theme.success, fontSize: 12 }}>
                      Ganhos: {formatCurrency(totalIncome)}
                    </Text>
                    <Text style={{ color: theme.error, fontSize: 12 }}>
                      Gastos: {formatCurrency(totalExpenses)}
                    </Text>
                  </View>
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
                  <Text style={styles.addButtonText}>+ Adicionar Novo Item</Text>
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

const createStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { padding: 20, paddingBottom: 100 },
    mainCard: {
      backgroundColor: theme.card,
      padding: 25,
      borderRadius: 24,
      borderWidth: 2,
      alignItems: "center",
      marginBottom: 25,
    },
    label: { color: theme.secondary, fontSize: 11, marginBottom: 4 },
    balanceValue: { fontSize: 32, fontWeight: "bold", marginTop: 5 },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      justifyContent: "space-between",
    },
    addButton: {
      marginTop: 25,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 15,
      borderStyle: "dashed",
    },
    addButtonText: { color: theme.primary, fontWeight: "bold" },
  });
