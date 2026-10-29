import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  ChevronRight,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  Wallet,
  Sparkles,
} from "lucide-react-native";
import { auth, db } from "../../FirebaseConfig";
import {
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
import { getThemeColor } from "../../constants/icons";

import { useBudget } from "../../hooks/useBudget";
import { Category } from "../../types/budget";

export interface ChartData {
  value: number;
  label?: string;
  frontColor?: string;
  showGradient?: boolean;
  gradientColor?: string;
  topLabelComponent?: () => React.ReactNode;
  color?: string;
  text?: string;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export default function Explore() {
  const { selectedMonthId, setSelectedMonthId } = useMonth();
  const { theme: themeMode } = useTheme();
  const isDark = themeMode === "dark";
  const theme = Colors[themeMode as keyof typeof Colors];

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearlyExpenses, setYearlyExpenses] = useState<ChartData[]>([]);
  const [yearlyInvestments, setYearlyInvestments] = useState<ChartData[]>([]);

  const [totalsAnuais, setTotalsAnuais] = useState({
    income: 0,
    expense: 0,
    investment: 0,
  });

  const [loadingYear, setLoadingYear] = useState(false);

  const offset = useSharedValue(0);
  const opacity = useSharedValue(1);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const cardGradient: [string, string] = isDark
    ? ["#1E262D", theme.card]
    : ["#FFFFFF", "#F8FAFC"];

  const primaryTintGradient: [string, string, string] = isDark
    ? ["#0E2A32", "#182228", theme.card]
    : ["#E4F8FB", "#F5FCFD", theme.card];

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

  const { budget, loading: loadingMonth } = useBudget(selectedMonthId);

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

    const expenses: ChartData[] = [];
    const investments: ChartData[] = [];

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
          ?.filter((c: Category) => c.categoryType === "expense")
          .reduce((acc: number, c: Category) => acc + (c.value || 0), 0) || 0;
      const monthInv =
        data?.categories
          ?.filter((c: Category) => c.categoryType === "investment")
          .reduce((acc: number, c: Category) => acc + (c.value || 0), 0) || 0;
      const monthInc =
        data?.categories
          ?.filter((c: Category) => c.categoryType === "income")
          .reduce((acc: number, c: Category) => acc + (c.value || 0), 0) || 0;

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
        (acc: { totalIncome: number; totalExpenses: number; totalInvestments: number }, cat: Category) => {
          if (cat.categoryType === "income") acc.totalIncome += cat.value || 0;
          else if (cat.categoryType === "investment")
            acc.totalInvestments += cat.value || 0;
          else acc.totalExpenses += cat.value || 0;
          return acc;
        },
        { totalIncome: 0, totalExpenses: 0, totalInvestments: 0 },
      );

      const formattedPie = budget.categories
        .filter((c: Category) => c.categoryType !== "income" && (c.value || 0) > 0)
        .map((cat: Category) => {
          const resolvedColor = getThemeColor(
            cat.color || theme.primary,
            themeMode as "dark" | "light"
          );
          return {
            value: cat.value || 0,
            color: resolvedColor,
            gradientColor: resolvedColor + "80",
            text: cat.name,
          };
        });

      return { ...totals, pieData: formattedPie };
    }, [budget, theme.primary, themeMode]);

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

  const totalOutflow = totalExpenses + totalInvestments;
  const incomeUsagePct =
    totalIncome > 0 ? ((totalOutflow / totalIncome) * 100).toFixed(0) : "0";
  const isOverBudget = Number(incomeUsagePct) > 100;

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[{ flex: 1 }, animatedStyle]}>
            <View
              style={[
                styles.cardWrapper,
                {
                  borderColor: theme.primary + (isDark ? "44" : "33"),
                  shadowColor: theme.primary,
                },
              ]}
            >
              <LinearGradient
                colors={primaryTintGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardInner}
              >
                <View
                  style={[
                    styles.decorativeCircle,
                    { backgroundColor: theme.primary + (isDark ? "12" : "15") },
                  ]}
                />

                <View style={styles.chartHeader}>
                  <View
                    style={[
                      styles.iconBadge,
                      {
                        backgroundColor: theme.primary + (isDark ? "24" : "18"),
                        borderColor: theme.primary + "44",
                      },
                    ]}
                  >
                    <PieIcon size={18} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.chartTitle}>
                      Distribuição de Gastos e Invest.
                    </Text>
                    <Text style={styles.chartSubtitle}>
                      Proporção por categoria no mês selecionado
                    </Text>
                  </View>
                </View>

                <View style={styles.fixedContentArea}>
                  {loadingMonth ? (
                    <ActivityIndicator color={theme.primary} size="large" />
                  ) : pieData.length === 0 ? (
                    <View style={styles.emptyState}>
                      <View
                        style={[
                          styles.emptyIconCircle,
                          { backgroundColor: theme.primary + "15" },
                        ]}
                      >
                        <Sparkles size={24} color={theme.primary} />
                      </View>
                      <Text style={styles.emptyTitle}>
                        Sem saídas registradas
                      </Text>
                      <Text style={styles.emptySubtitle}>
                        Adicione gastos ou investimentos na tela inicial para visualizar a distribuição.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.pieWrapper}>
                        <PieChart
                          data={pieData}
                          donut
                          radius={105}
                          innerRadius={74}
                          innerCircleColor={theme.card}
                          showGradient
                          centerLabelComponent={() => (
                            <View style={styles.centerLabelWrap}>
                              <Text
                                style={[
                                  styles.centerValue,
                                  {
                                    color: isOverBudget
                                      ? theme.error
                                      : theme.primary,
                                  },
                                ]}
                              >
                                {incomeUsagePct}%
                              </Text>
                              <Text style={styles.centerLabel}>
                                USO DA RENDA
                              </Text>
                            </View>
                          )}
                        />
                      </View>

                      <View style={styles.legendGrid}>
                        {pieData.map((item: ChartData, i: number) => {
                          const pct =
                            totalOutflow > 0
                              ? Math.round((item.value / totalOutflow) * 100)
                              : 0;
                          return (
                            <View
                              key={i}
                              style={[
                                styles.legendChip,
                                {
                                  backgroundColor: isDark
                                    ? "rgba(255,255,255,0.04)"
                                    : "rgba(0,0,0,0.03)",
                                  borderColor: (item.color || theme.primary) + "44",
                                },
                              ]}
                            >
                              <View
                                style={[
                                  styles.dot,
                                  { backgroundColor: item.color },
                                ]}
                              />
                              <Text style={styles.legendText} numberOfLines={1}>
                                {item.text}
                              </Text>
                              <Text
                                style={[
                                  styles.legendPct,
                                  { color: item.color || theme.primary },
                                ]}
                              >
                                {pct}%
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </>
                  )}
                </View>
              </LinearGradient>
            </View>

            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardInner}
              >
                <View style={styles.chartHeader}>
                  <View
                    style={[
                      styles.iconBadge,
                      {
                        backgroundColor: theme.primary + (isDark ? "24" : "18"),
                        borderColor: theme.primary + "44",
                      },
                    ]}
                  >
                    <BarChart3 size={18} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.chartTitle}>Resumo do Mês</Text>
                    <Text style={styles.chartSubtitle}>
                      Comparativo entre ganhos, gastos e investimentos
                    </Text>
                  </View>
                </View>

                <View style={styles.kpiRow}>
                  <View
                    style={[
                      styles.kpiChip,
                      { borderColor: theme.success + "40" },
                    ]}
                  >
                    <View style={styles.kpiHeader}>
                      <Wallet size={12} color={theme.success} />
                      <Text style={styles.kpiLabel}>Ganhos</Text>
                    </View>
                    <Text
                      style={[styles.kpiValue, { color: theme.success }]}
                      numberOfLines={1}
                    >
                      {formatCurrency(totalIncome)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.kpiChip,
                      { borderColor: theme.error + "40" },
                    ]}
                  >
                    <View style={styles.kpiHeader}>
                      <TrendingDown size={12} color={theme.error} />
                      <Text style={styles.kpiLabel}>Gastos</Text>
                    </View>
                    <Text
                      style={[styles.kpiValue, { color: theme.error }]}
                      numberOfLines={1}
                    >
                      {formatCurrency(totalExpenses)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.kpiChip,
                      { borderColor: theme.warning + "40" },
                    ]}
                  >
                    <View style={styles.kpiHeader}>
                      <TrendingUp size={12} color={theme.warning} />
                      <Text style={styles.kpiLabel}>Invest.</Text>
                    </View>
                    <Text
                      style={[styles.kpiValue, { color: theme.warning }]}
                      numberOfLines={1}
                    >
                      {formatCurrency(totalInvestments)}
                    </Text>
                  </View>
                </View>

                <View style={styles.fixedBarArea}>
                  {loadingMonth ? (
                    <ActivityIndicator color={theme.primary} />
                  ) : (
                    <BarChart
                      data={barData}
                      barWidth={58}
                      spacing={32}
                      barBorderRadius={10}
                      yAxisThickness={0}
                      xAxisThickness={0}
                      hideRules
                      noOfSections={3}
                      yAxisExtraHeight={28}
                      xAxisLabelsHeight={22}
                      yAxisTextStyle={{ color: theme.secondary, fontSize: 10 }}
                      xAxisLabelTextStyle={{
                        color: theme.text,
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    />
                  )}
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        </GestureDetector>

        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardInner}
          >
            <View style={styles.yearSelectorCard}>
              <TouchableOpacity
                style={styles.yearNavBtn}
                onPress={() => setSelectedYear((y) => y - 1)}
              >
                <ChevronLeft size={20} color={theme.primary} />
              </TouchableOpacity>

              <View style={styles.yearCenterInfo}>
                <View style={styles.yearBadgeRow}>
                  <Calendar size={14} color={theme.primary} />
                  <Text style={[styles.yearBadgeText, { color: theme.primary }]}>
                    PAINEL ANUAL
                  </Text>
                </View>
                <Text style={styles.yearTitle}>Visão Anual {selectedYear}</Text>
              </View>

              <TouchableOpacity
                style={styles.yearNavBtn}
                onPress={() => setSelectedYear((y) => y + 1)}
              >
                <ChevronRight size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.kpiRow, { marginBottom: 22 }]}>
              <View
                style={[styles.kpiChip, { borderColor: theme.success + "40" }]}
              >
                <Text style={styles.kpiLabel}>Ganhos no Ano</Text>
                <Text
                  style={[styles.kpiValue, { color: theme.success }]}
                  numberOfLines={1}
                >
                  {formatCurrency(totalsAnuais.income)}
                </Text>
              </View>
              <View
                style={[styles.kpiChip, { borderColor: theme.error + "40" }]}
              >
                <Text style={styles.kpiLabel}>Gastos no Ano</Text>
                <Text
                  style={[styles.kpiValue, { color: theme.error }]}
                  numberOfLines={1}
                >
                  {formatCurrency(totalsAnuais.expense)}
                </Text>
              </View>
              <View
                style={[styles.kpiChip, { borderColor: theme.warning + "40" }]}
              >
                <Text style={styles.kpiLabel}>Invest. no Ano</Text>
                <Text
                  style={[styles.kpiValue, { color: theme.warning }]}
                  numberOfLines={1}
                >
                  {formatCurrency(totalsAnuais.investment)}
                </Text>
              </View>
            </View>

            <View style={styles.subCard}>
              <View style={styles.subChartHeader}>
                <View
                  style={[
                    styles.smallIconBadge,
                    { backgroundColor: theme.primary + "20" },
                  ]}
                >
                  <LayoutGrid size={15} color={theme.primary} />
                </View>
                <Text style={styles.subChartTitle}>
                  Resumo Consolidado Anual
                </Text>
              </View>

              <View style={styles.fixedBarArea}>
                {loadingYear ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <BarChart
                    data={yearlyConsolidatedData}
                    barWidth={56}
                    spacing={30}
                    barBorderRadius={10}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    hideRules
                    noOfSections={3}
                    yAxisExtraHeight={35}
                    xAxisLabelsHeight={22}
                    yAxisTextStyle={{ color: theme.secondary, fontSize: 10 }}
                    xAxisLabelTextStyle={{
                      color: theme.text,
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  />
                )}
              </View>
            </View>

            <View style={[styles.subCard, { marginTop: 16 }]}>
              <View style={styles.subChartHeaderBetween}>
                <View style={styles.subChartHeaderLeft}>
                  <View
                    style={[
                      styles.smallIconBadge,
                      { backgroundColor: theme.error + "20" },
                    ]}
                  >
                    <TrendingDown size={15} color={theme.error} />
                  </View>
                  <Text style={styles.subChartTitle}>Gastos Mensais</Text>
                </View>
                <Text style={styles.scrollHint}>Deslize →</Text>
              </View>

              <View style={styles.fixedYearlyArea}>
                {loadingYear ? (
                  <ActivityIndicator
                    color={theme.primary}
                    style={{ marginTop: 50 }}
                  />
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 10 }}
                  >
                    <BarChart
                      data={yearlyExpenses}
                      height={175}
                      barWidth={50}
                      spacing={18}
                      barBorderRadius={8}
                      hideRules
                      yAxisThickness={0}
                      xAxisThickness={0}
                      yAxisExtraHeight={25}
                      xAxisLabelsHeight={22}
                      yAxisTextStyle={{ color: theme.secondary, fontSize: 10 }}
                      xAxisLabelTextStyle={{
                        color: theme.text,
                        fontSize: 10,
                        fontWeight: "600",
                      }}
                    />
                  </ScrollView>
                )}
              </View>
            </View>

            <View style={[styles.subCard, { marginTop: 16 }]}>
              <View style={styles.subChartHeaderBetween}>
                <View style={styles.subChartHeaderLeft}>
                  <View
                    style={[
                      styles.smallIconBadge,
                      { backgroundColor: theme.warning + "20" },
                    ]}
                  >
                    <TrendingUp size={15} color={theme.warning} />
                  </View>
                  <Text style={styles.subChartTitle}>
                    Investimentos Mensais
                  </Text>
                </View>
                <Text style={styles.scrollHint}>Deslize →</Text>
              </View>

              <View style={styles.fixedYearlyArea}>
                {loadingYear ? (
                  <ActivityIndicator
                    color={theme.warning}
                    style={{ marginTop: 50 }}
                  />
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 10 }}
                  >
                    <BarChart
                      data={yearlyInvestments}
                      height={175}
                      barWidth={50}
                      spacing={18}
                      barBorderRadius={8}
                      hideRules
                      yAxisThickness={0}
                      xAxisThickness={0}
                      yAxisExtraHeight={25}
                      xAxisLabelsHeight={22}
                      yAxisTextStyle={{ color: theme.secondary, fontSize: 10 }}
                      xAxisLabelTextStyle={{
                        color: theme.text,
                        fontSize: 10,
                        fontWeight: "600",
                      }}
                    />
                  </ScrollView>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof Colors.light, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { padding: 20, paddingBottom: 60 },
    cardWrapper: {
      backgroundColor: theme.card,
      borderRadius: 26,
      marginBottom: 22,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 12,
    },
    cardInner: {
      padding: 20,
      position: "relative",
      overflow: "hidden",
    },
    decorativeCircle: {
      position: "absolute",
      width: 180,
      height: 180,
      borderRadius: 90,
      right: -50,
      top: -50,
    },
    chartHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 18,
    },
    iconBadge: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    chartTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: -0.2,
    },
    chartSubtitle: {
      color: theme.secondary,
      fontSize: 11,
      marginTop: 2,
    },
    fixedContentArea: {
      minHeight: 300,
      justifyContent: "center",
      alignItems: "center",
    },
    pieWrapper: {
      paddingVertical: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    centerLabelWrap: {
      alignItems: "center",
      justifyContent: "center",
    },
    centerValue: {
      fontSize: 26,
      fontWeight: "900",
      letterSpacing: -0.5,
    },
    centerLabel: {
      color: theme.secondary,
      fontSize: 9,
      fontWeight: "700",
      letterSpacing: 1,
      marginTop: 2,
    },
    legendGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 8,
      marginTop: 22,
      width: "100%",
    },
    legendChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      maxWidth: "48%",
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendText: {
      color: theme.text,
      fontSize: 11,
      fontWeight: "600",
      flexShrink: 1,
    },
    legendPct: {
      fontSize: 10,
      fontWeight: "800",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 35,
      paddingHorizontal: 20,
    },
    emptyIconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 4,
    },
    emptySubtitle: {
      color: theme.secondary,
      fontSize: 12,
      textAlign: "center",
      lineHeight: 17,
    },
    kpiRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    kpiChip: {
      flex: 1,
      backgroundColor: isDark
        ? "rgba(0, 0, 0, 0.25)"
        : "rgba(255, 255, 255, 0.85)",
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderWidth: 1,
      gap: 4,
    },
    kpiHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    kpiLabel: {
      color: theme.secondary,
      fontSize: 10,
      fontWeight: "600",
    },
    kpiValue: {
      fontSize: 12,
      fontWeight: "800",
    },
    fixedBarArea: {
      minHeight: 255,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 10,
      paddingBottom: 12,
    },
    fixedYearlyArea: {
      minHeight: 250,
      paddingTop: 10,
      paddingBottom: 12,
    },
    yearSelectorCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: isDark
        ? "rgba(0, 0, 0, 0.25)"
        : "rgba(0, 0, 0, 0.03)",
      borderRadius: 18,
      padding: 12,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(0, 0, 0, 0.05)",
    },
    yearNavBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(255, 255, 255, 0.9)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    yearCenterInfo: {
      alignItems: "center",
      gap: 2,
    },
    yearBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    yearBadgeText: {
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1.2,
    },
    yearTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
    },
    subCard: {
      backgroundColor: isDark
        ? "rgba(0, 0, 0, 0.22)"
        : "rgba(255, 255, 255, 0.7)",
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(0, 0, 0, 0.05)",
    },
    subChartHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    subChartHeaderBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    subChartHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    smallIconBadge: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    subChartTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700",
    },
    scrollHint: {
      color: theme.secondary,
      fontSize: 10,
      fontWeight: "600",
      opacity: 0.8,
    },
    barTopValue: {
      color: theme.secondary,
      fontSize: 9,
      fontWeight: "700",
      marginBottom: 4,
    },
  });
