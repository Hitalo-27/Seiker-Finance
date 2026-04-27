import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronRight,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
} from "lucide-react-native";
import { auth, db } from "../../FirebaseConfig";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
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
import { useMonth } from "@/context/MonthContext";
import { useTheme } from "@/context/ThemeContext";
import { useFocusEffect } from "expo-router";

const formatCurrency = (value: number) => {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export default function Explore() {
  const { selectedMonthId, setSelectedMonthId } = useMonth();
  const { theme: themeMode } = useTheme();
  const theme = Colors[themeMode as keyof typeof Colors];

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [budget, setBudget] = useState<any>(null);
  const [yearlyExpenses, setYearlyExpenses] = useState<any[]>([]);
  const [yearlyInvestments, setYearlyInvestments] = useState<any[]>([]);

  const [totalsAnuais, setTotalsAnuais] = useState({
    income: 0,
    expense: 0,
    investment: 0,
  });

  const [loadingMonth, setLoadingMonth] = useState(true);
  const [loadingYear, setLoadingYear] = useState(false);

  const offset = useSharedValue(0);
  const opacity = useSharedValue(1);

  const styles = useMemo(() => createStyles(theme), [theme]);

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
    transform: [{ translateX: offset.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    setLoadingMonth(true);
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
      setLoadingMonth(false);
    });
  }, [selectedMonthId]);

  const fetchYearlyData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoadingYear(true);

    const start = `${selectedYear}-01`;
    const end = `${selectedYear}-12`;
    const q = query(
      collection(db, "users", user.uid, "monthlyBudgets"),
      where("__name__", ">=", start),
      where("__name__", "<=", end),
    );

    const querySnap = await getDocs(q);
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    const expenses: any[] = [];
    const investments: any[] = [];

    let sumIncome = 0;
    let sumExpense = 0;
    let sumInvestment = 0;

    months.forEach((mLabel, i) => {
      const mIdx = (i + 1).toString().padStart(2, "0");
      const data = querySnap.docs
        .find((d) => d.id === `${selectedYear}-${mIdx}`)
        ?.data();

      const monthExp =
        data?.categories
          ?.filter((c: any) => c.categoryType === "expense")
          .reduce((acc: number, c: any) => acc + (c.value || 0), 0) || 0;
      const monthInv =
        data?.categories
          ?.filter((c: any) => c.categoryType === "investment")
          .reduce((acc: number, c: any) => acc + (c.value || 0), 0) || 0;
      const monthInc =
        data?.categories
          ?.filter((c: any) => c.categoryType === "income")
          .reduce((acc: number, c: any) => acc + (c.value || 0), 0) || 0;

      sumIncome += monthInc;
      sumExpense += monthExp;
      sumInvestment += monthInv;

      expenses.push({
        value: monthExp,
        label: mLabel,
        frontColor: theme.error,
        showGradient: true,
        gradientColor: theme.errorGradient,
        topLabelComponent: () => (
          <Text style={styles.barTopValue}>
            {monthExp > 0 ? formatCurrency(monthExp) : ""}
          </Text>
        ),
      });

      investments.push({
        value: monthInv,
        label: mLabel,
        frontColor: theme.warning,
        showGradient: true,
        gradientColor: theme.warningGradient,
        topLabelComponent: () => (
          <Text style={styles.barTopValue}>
            {monthInv > 0 ? formatCurrency(monthInv) : ""}
          </Text>
        ),
      });
    });

    setTotalsAnuais({
      income: sumIncome,
      expense: sumExpense,
      investment: sumInvestment,
    });
    setYearlyExpenses(expenses);
    setYearlyInvestments(investments);
    setLoadingYear(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchYearlyData();
    }, [selectedYear]),
  );

  const yearlyConsolidatedData = [
    {
      value: totalsAnuais.income,
      label: "Ganhos",
      frontColor: theme.success,
      showGradient: true,
      gradientColor: theme.successGradient,
      topLabelComponent: () => (
        <Text style={styles.barTopValue}>
          {totalsAnuais.income > 0 ? formatCurrency(totalsAnuais.income) : ""}
        </Text>
      ),
    },
    {
      value: totalsAnuais.expense,
      label: "Gastos",
      frontColor: theme.error,
      showGradient: true,
      gradientColor: theme.errorGradient,
      topLabelComponent: () => (
        <Text style={styles.barTopValue}>
          {totalsAnuais.expense > 0 ? formatCurrency(totalsAnuais.expense) : ""}
        </Text>
      ),
    },
    {
      value: totalsAnuais.investment,
      label: "Invest.",
      frontColor: theme.warning,
      showGradient: true,
      gradientColor: theme.warningGradient,
      topLabelComponent: () => (
        <Text style={styles.barTopValue}>
          {totalsAnuais.investment > 0
            ? formatCurrency(totalsAnuais.investment)
            : ""}
        </Text>
      ),
    },
  ];

  const { totalIncome, totalExpenses, totalInvestments, pieData } =
    useMemo(() => {
      if (!budget?.categories)
        return {
          totalIncome: 0,
          totalExpenses: 0,
          totalInvestments: 0,
          pieData: [],
        };

      const totals = budget.categories.reduce(
        (acc: any, cat: any) => {
          if (cat.categoryType === "income") acc.totalIncome += cat.value || 0;
          else if (cat.categoryType === "investment")
            acc.totalInvestments += cat.value || 0;
          else acc.totalExpenses += cat.value || 0;
          return acc;
        },
        { totalIncome: 0, totalExpenses: 0, totalInvestments: 0 },
      );

      const formattedPie = budget.categories
        .filter((c: any) => c.categoryType !== "income" && (c.value || 0) > 0)
        .map((cat: any) => ({
          value: cat.value || 0,
          color: cat.color || theme.primary,
          gradientColor: cat.color ? cat.color + "80" : theme.primary + "80",
          text: cat.name,
        }));

      return { ...totals, pieData: formattedPie };
    }, [budget, theme.primary]);

  const barData = [
    {
      value: totalIncome,
      label: "Ganhos",
      frontColor: theme.success,
      showGradient: true,
      gradientColor: theme.successGradient,
      topLabelComponent: () => (
        <Text style={styles.barTopValue}>
          {totalIncome > 0 ? formatCurrency(totalIncome) : ""}
        </Text>
      ),
    },
    {
      value: totalExpenses,
      label: "Gastos",
      frontColor: theme.error,
      showGradient: true,
      gradientColor: theme.errorGradient,
      topLabelComponent: () => (
        <Text style={styles.barTopValue}>
          {totalExpenses > 0 ? formatCurrency(totalExpenses) : ""}
        </Text>
      ),
    },
    {
      value: totalInvestments,
      label: "Invest.",
      frontColor: theme.warning,
      showGradient: true,
      gradientColor: theme.warningGradient,
      topLabelComponent: () => (
        <Text style={styles.barTopValue}>
          {totalInvestments > 0 ? formatCurrency(totalInvestments) : ""}
        </Text>
      ),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[{ flex: 1 }, animatedStyle]}>
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <PieIcon size={20} color={theme.primary} />
                <Text style={styles.chartLabel}>
                  Distribuição de Gastos/Invest.
                </Text>
              </View>
              <View style={styles.fixedContentArea}>
                {loadingMonth ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <>
                    <PieChart
                      data={pieData}
                      donut
                      radius={105}
                      innerRadius={75}
                      innerCircleColor={theme.card}
                      showGradient
                      centerLabelComponent={() => (
                        <View style={{ alignItems: "center" }}>
                          <Text style={styles.centerValue}>
                            {totalIncome > 0
                              ? (
                                  ((totalExpenses + totalInvestments) /
                                    totalIncome) *
                                  100
                                ).toFixed(0)
                              : 0}
                            %
                          </Text>
                          <Text style={styles.centerLabel}>Uso da Renda</Text>
                        </View>
                      )}
                    />
                    <View style={styles.legendGrid}>
                      {pieData.map((item: any, i: number) => (
                        <View key={i} style={styles.legendItem}>
                          <View
                            style={[
                              styles.dot,
                              { backgroundColor: item.color },
                            ]}
                          />
                          <Text style={styles.legendText}>{item.text}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <BarChart3 size={20} color={theme.primary} />
                <Text style={styles.chartLabel}>Resumo do Mês</Text>
              </View>
              <View style={styles.fixedBarArea}>
                {loadingMonth ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <BarChart
                    data={barData}
                    barWidth={60}
                    barBorderRadius={8}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    hideRules
                    noOfSections={3}
                    yAxisExtraHeight={25}
                    yAxisTextStyle={{ color: theme.secondary, fontSize: 10 }}
                    xAxisLabelTextStyle={{
                      color: theme.text,
                      fontSize: 11,
                      fontWeight: "bold",
                    }}
                  />
                )}
              </View>
            </View>
          </Animated.View>
        </GestureDetector>

        <View style={styles.chartCard}>
          <View style={styles.yearSelector}>
            <TouchableOpacity onPress={() => setSelectedYear((y) => y - 1)}>
              <ChevronLeft color={theme.primary} />
            </TouchableOpacity>
            <View style={styles.yearTitleRow}>
              <Calendar size={18} color={theme.primary} />
              <Text style={styles.yearTitle}>Visão Anual {selectedYear}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedYear((y) => y + 1)}>
              <ChevronRight color={theme.primary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.chartHeader, { marginBottom: 15 }]}>
            <LayoutGrid size={18} color={theme.primary} />
            <Text style={[styles.chartLabel, { marginBottom: 0 }]}>
              Resumo Consolidado Anual
            </Text>
          </View>
          <View style={[styles.fixedBarArea, { marginBottom: 30 }]}>
            {loadingYear ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <BarChart
                data={yearlyConsolidatedData}
                barWidth={60}
                barBorderRadius={8}
                yAxisThickness={0}
                xAxisThickness={0}
                hideRules
                noOfSections={3}
                yAxisExtraHeight={35}
                yAxisTextStyle={{ color: theme.secondary, fontSize: 10 }}
                xAxisLabelTextStyle={{
                  color: theme.text,
                  fontSize: 11,
                  fontWeight: "bold",
                }}
              />
            )}
          </View>

          <View style={[styles.chartHeader, { marginBottom: 15 }]}>
            <TrendingDown size={18} color={theme.error} />
            <Text style={[styles.chartLabel, { marginBottom: 0 }]}>
              Gastos Mensais
            </Text>
          </View>
          <View style={styles.fixedYearlyArea}>
            {loadingYear ? (
              <ActivityIndicator
                color={theme.primary}
                style={{ marginTop: 50 }}
              />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={yearlyExpenses}
                  height={180}
                  barWidth={55}
                  spacing={18}
                  barBorderRadius={6}
                  hideRules
                  yAxisThickness={0}
                  xAxisThickness={0}
                  yAxisExtraHeight={25}
                  yAxisTextStyle={{ color: theme.secondary, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: theme.text, fontSize: 10 }}
                />
              </ScrollView>
            )}
          </View>

          <View
            style={[styles.chartHeader, { marginTop: 40, marginBottom: 15 }]}
          >
            <TrendingUp size={18} color={theme.warning} />
            <Text style={[styles.chartLabel, { marginBottom: 0 }]}>
              Investimentos Mensais
            </Text>
          </View>
          <View style={styles.fixedYearlyArea}>
            {loadingYear ? (
              <ActivityIndicator color={theme.warning} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={yearlyInvestments}
                  height={180}
                  barWidth={55}
                  spacing={18}
                  barBorderRadius={6}
                  hideRules
                  yAxisThickness={0}
                  xAxisThickness={0}
                  yAxisExtraHeight={25}
                  yAxisTextStyle={{ color: theme.secondary, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: theme.text, fontSize: 10 }}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { padding: 20, paddingBottom: 50 },
    chartCard: {
      backgroundColor: theme.card,
      borderRadius: 25,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    chartHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 20,
    },
    chartLabel: { color: theme.secondary, fontSize: 14, fontWeight: "600" },
    subChartTitle: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "bold",
      marginBottom: 10,
    },
    fixedContentArea: {
      minHeight: 320,
      justifyContent: "center",
      alignItems: "center",
    },
    fixedBarArea: {
      height: 240,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 10,
    },
    fixedYearlyArea: { height: 240, paddingTop: 10 },
    centerValue: { color: theme.primary, fontSize: 22, fontWeight: "bold" },
    centerLabel: { color: theme.secondary, fontSize: 10 },
    legendGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 12,
      marginTop: 20,
    },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { color: theme.secondary, fontSize: 10 },
    yearSelector: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 25,
    },
    yearTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    yearTitle: { color: theme.text, fontSize: 17, fontWeight: "bold" },
    barTopValue: { color: theme.secondary, fontSize: 9, marginBottom: 4 },
  });
