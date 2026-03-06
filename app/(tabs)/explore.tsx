import React, { useEffect, useState, useMemo } from "react";
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
import { useTheme } from "@/context/ThemeContext"; // 1. Importando o tema correto

export default function Explore() {
  const { selectedMonthId, setSelectedMonthId } = useMonth();

  // 2. Trocando o useColorScheme pelo tema do nosso contexto
  const { theme: themeMode } = useTheme();
  const theme = Colors[themeMode as keyof typeof Colors];

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [budget, setBudget] = useState<any>(null);
  const [yearlyData, setYearlyData] = useState<any[]>([]);
  const [loadingMonth, setLoadingMonth] = useState(true);
  const [loadingYear, setLoadingYear] = useState(false);

  const offset = useSharedValue(0);
  const opacity = useSharedValue(1);

  // 3. Memoizando os estilos para performance e evitar erros de dependência do ESLint
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

  useEffect(() => {
    const fetchYearly = async () => {
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

      const formatted = months.map((mLabel, i) => {
        const mIdx = (i + 1).toString().padStart(2, "0");
        const data = querySnap.docs
          .find((d) => d.id === `${selectedYear}-${mIdx}`)
          ?.data();
        const exp =
          data?.categories?.reduce(
            (acc: number, c: any) => acc + (c.value || 0),
            0,
          ) || 0;

        return {
          value: exp,
          label: mLabel,
          frontColor: theme.error,
          topLabelComponent: () => (
            <Text style={styles.barTopValue}>R$ {exp.toFixed(0)}</Text>
          ),
        };
      });

      setYearlyData(formatted);
      setLoadingYear(false);
    };
    fetchYearly();
    // 4. Adicionando as dependências que o ESLint pediu antes
  }, [selectedYear, theme.error, styles.barTopValue]);

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
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <ChevronLeft color={theme.primary} size={28} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {formatMonthTitle(selectedMonthId)}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <ChevronRight color={theme.primary} size={28} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[{ flex: 1 }, animatedStyle]}>
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <PieIcon size={20} color={theme.primary} />
                <Text style={styles.chartLabel}>Distribuição Mensal</Text>
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
                      innerRadius={70}
                      innerCircleColor={theme.card}
                      showGradient
                      centerLabelComponent={() => (
                        <View style={{ alignItems: "center" }}>
                          <Text style={styles.centerValue}>
                            {(
                              (totalExpenses / (budget?.income || 1)) *
                              100
                            ).toFixed(0)}
                            %
                          </Text>
                          <Text style={styles.centerLabel}>Gasto</Text>
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
                <Text style={styles.chartLabel}>Renda x Gastos</Text>
              </View>
              <View style={styles.fixedBarArea}>
                {loadingMonth ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
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
                )}
              </View>
            </View>
          </Animated.View>
        </GestureDetector>

        {/* CARD ANUAL - COM ALTURA BLINDADA PARA NÃO PULAR */}
        <View style={styles.chartCard}>
          <View style={styles.yearSelector}>
            <TouchableOpacity onPress={() => setSelectedYear((y) => y - 1)}>
              <ChevronLeft color={theme.primary} />
            </TouchableOpacity>
            <View style={styles.yearTitleRow}>
              <Calendar size={18} color={theme.primary} />
              <Text style={styles.yearTitle}>Resumo {selectedYear}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedYear((y) => y + 1)}>
              <ChevronRight color={theme.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.fixedYearlyArea}>
            {loadingYear ? (
              <View style={styles.loadingInner}>
                <ActivityIndicator color={theme.primary} size="large" />
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={yearlyData}
                  height={200}
                  barWidth={30}
                  spacing={20}
                  initialSpacing={10}
                  hideRules
                  yAxisThickness={0}
                  xAxisThickness={0}
                  yAxisTextStyle={{ color: theme.secondary, fontSize: 10 }}
                  xAxisLabelTextStyle={{
                    color: theme.text,
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
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
    scroll: { padding: 20, paddingBottom: 50 },
    chartCard: {
      backgroundColor: theme.card,
      borderRadius: 25,
      padding: 25,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    chartHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 25,
    },
    chartLabel: { color: theme.secondary, fontSize: 14, fontWeight: "600" },

    // ALTURAS FIXAS PARA EVITAR O PULO
    fixedContentArea: {
      height: 320,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    fixedBarArea: {
      height: 220,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    fixedYearlyArea: { height: 280, width: "100%" },
    loadingInner: {
      height: 280,
      justifyContent: "center",
      alignItems: "center",
    },

    centerValue: { color: theme.primary, fontSize: 24, fontWeight: "bold" },
    centerLabel: { color: theme.secondary, fontSize: 11 },
    legendGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 15,
      marginTop: 20,
    },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { color: theme.secondary, fontSize: 11 },
    yearSelector: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      alignItems: "center",
      marginBottom: 20,
    },
    yearTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    yearTitle: { color: theme.text, fontSize: 18, fontWeight: "bold" },
    barTopValue: { color: theme.secondary, fontSize: 8 },
  });

const formatMonthTitle = (id: string) => {
  const [y, m] = id.split("-").map(Number);
  return new Date(y, m - 1).toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  });
};
