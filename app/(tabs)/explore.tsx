import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronRight,
  PieChart as PieIcon,
  BarChart3,
  Activity,
} from "lucide-react-native";
import { auth, db } from "../../FirebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { Colors } from "../../constants/theme";

import { PieChart, BarChart } from "react-native-gifted-charts";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

export default function Explore() {
  const [selectedMonthId, setSelectedMonthId] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const offset = useSharedValue(0);

  const opacity = useSharedValue(1);
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);

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

  const animatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: offset.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);

    const budgetRef = doc(
      db,
      "users",
      user.uid,
      "monthlyBudgets",
      selectedMonthId,
    );
    return onSnapshot(budgetRef, (docSnap) => {
      if (docSnap.exists()) setBudget(docSnap.data());
      else setBudget(null);
      setLoading(false);
    });
  }, [selectedMonthId]);

  const pieData =
    budget?.categories
      ?.map((cat: any) => ({
        value: cat.value || 0,
        color: cat.color || theme.primary,
        gradientColor: cat.color ? cat.color + "80" : theme.primary + "80",
        text: cat.name,
      }))
      .filter((d: any) => d.value > 0) || [];

  const totalExpenses =
    budget?.categories?.reduce(
      (acc: number, cat: any) => acc + (cat.value || 0),
      0,
    ) || 0;

  const barData = [
    {
      value: budget?.income || 0,
      label: "Renda",
      frontColor: theme.primary,
      showGradient: true,
      gradientColor: "#00575B",
    },
    {
      value: totalExpenses,
      label: "Gastos",
      frontColor: theme.error,
      showGradient: true,
      gradientColor: "#7B1212",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.selectorContainer}>
        <ChevronLeft
          color={theme.primary}
          size={28}
          onPress={() => changeMonth(-1)}
        />
        <Text style={styles.monthTitle}>
          {formatMonthTitle(selectedMonthId)}
        </Text>
        <ChevronRight
          color={theme.primary}
          size={28}
          onPress={() => changeMonth(1)}
        />
      </View>

      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={animatedStyle}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator
                color={theme.primary}
                size="large"
                style={{ marginTop: 50 }}
              />
            ) : !budget || (budget.income === 0 && totalExpenses === 0) ? (
              <View style={styles.emptyContainer}>
                <Activity size={40} color={theme.secondary} />
                <Text style={styles.emptyText}>Sem dados para este mês.</Text>
              </View>
            ) : (
              <>
                <View style={styles.chartCard}>
                  <View style={styles.chartHeader}>
                    <PieIcon size={20} color={theme.primary} />
                    <Text style={styles.chartLabel}>
                      Distribuição por Categoria
                    </Text>
                  </View>
                  <PieChart
                    data={pieData}
                    donut
                    radius={110}
                    innerRadius={75}
                    innerCircleColor={theme.card}
                    centerLabelComponent={() => (
                      <View style={{ alignItems: "center" }}>
                        <Text
                          style={{
                            color: theme.text,
                            fontSize: 18,
                            fontWeight: "bold",
                          }}
                        >
                          {(
                            (totalExpenses / (budget.income || 1)) *
                            100
                          ).toFixed(0)}
                          %
                        </Text>
                        <Text style={{ color: theme.secondary, fontSize: 10 }}>
                          Comprometido
                        </Text>
                      </View>
                    )}
                  />
                  <View style={styles.legendGrid}>
                    {pieData.map((item: any, i: number) => (
                      <View key={i} style={styles.legendItem}>
                        <View
                          style={[styles.dot, { backgroundColor: item.color }]}
                        />
                        <Text style={styles.legendText}>{item.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.chartCard}>
                  <View style={styles.chartHeader}>
                    <BarChart3 size={20} color={theme.primary} />
                    <Text style={styles.chartLabel}>Balanço Geral</Text>
                  </View>
                  <BarChart
                    data={barData}
                    barWidth={60}
                    barBorderRadius={10}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    hideRules
                    yAxisTextStyle={{ color: theme.secondary, fontSize: 10 }}
                    xAxisLabelTextStyle={{
                      color: theme.text,
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    selectorContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 15,
      gap: 20,
    },
    monthTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "bold",
      textTransform: "capitalize",
    },
    scroll: { padding: 20, paddingBottom: 100 },
    chartCard: {
      backgroundColor: theme.card,
      borderRadius: 25,
      padding: 25,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
    },
    chartHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      alignSelf: "flex-start",
      marginBottom: 25,
    },
    chartLabel: { color: theme.secondary, fontSize: 14, fontWeight: "600" },
    legendGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 15,
      marginTop: 25,
    },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { color: theme.secondary, fontSize: 12 },
    emptyContainer: { alignItems: "center", marginTop: 100 },
    emptyText: { color: theme.secondary, marginTop: 15, fontSize: 16 },
  });

const formatMonthTitle = (id: string) => {
  const [y, m] = id.split("-").map(Number);
  return new Date(y, m - 1).toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  });
};
