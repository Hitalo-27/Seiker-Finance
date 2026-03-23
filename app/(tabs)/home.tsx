import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  X,
  Target,
  Wallet,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react-native";
import { auth, db } from "../../FirebaseConfig";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { Colors } from "../../constants/theme";

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
import { ICON_LIST, PRESET_COLORS } from "../../constants/icons";
import { useAlert } from "@/context/AlertContext";

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

  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"split" | "replicate">("split");

  const [categoryType, setCategoryType] = useState<
    "expense" | "investment" | "income"
  >("expense");
  const [inputValue, setInputValue] = useState("");

  const offset = useSharedValue(0);
  const opacity = useSharedValue(1);
  const { showAlert } = useAlert();

  const openEditModal = (item: any, isNew: boolean) => {
    const savedMonths = item.totalMonths || 1;
    const savedMode = item.repeatMode || "split";
    const savedType = item.categoryType || "expense";

    const totalValue =
      savedMode === "split" ? item.value * savedMonths : item.value;

    setEditItem({
      ...item,
      value: totalValue,
      installments: isNew ? "1" : String(savedMonths),
    });

    setIsNewCategory(isNew);
    setRepeatMode(savedMode);
    setCategoryType(savedType);
    setInputValue(
      totalValue > 0 ? String(totalValue.toFixed(2)).replace(".", ",") : "",
    );
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

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    setBudget(null);

    const budgetRef = doc(
      db,
      "users",
      user.uid,
      "monthlyBudgets",
      selectedMonthId,
    );

    const unsubscribe = onSnapshot(budgetRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBudget({
          categories: data.categories || [],
        });
        setLoading(false);
      } else {
        await initializeMonth(user.uid, selectedMonthId);
      }
    });

    return () => unsubscribe();
  }, [selectedMonthId]);

  const initializeMonth = async (uid: string, monthId: string) => {
    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      const userData = userSnap.data();
      const categoriesToUse = userData?.categoryTemplate || [];

      const docRef = doc(db, "users", uid, "monthlyBudgets", monthId);
      await setDoc(docRef, {
        categories: categoriesToUse,
      });
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user || !editItem) return;
    setIsSaving(true);

    try {
      const oldMonths = editItem.totalMonths || 1;
      const newMonths = parseInt(editItem.installments) || 1;
      const groupId = editItem.groupId || Date.now().toString();
      const valuePerMonth =
        repeatMode === "split" ? editItem.value / newMonths : editItem.value;

      for (let i = 0; i < newMonths; i++) {
        const [y, m] = selectedMonthId.split("-").map(Number);
        const date = new Date(y, m - 1 + i, 1);
        const targetMonthId = date.toISOString().slice(0, 7);
        const targetRef = doc(
          db,
          "users",
          user.uid,
          "monthlyBudgets",
          targetMonthId,
        );
        const docSnap = await getDoc(targetRef);

        const categoryData = {
          ...editItem,
          value: valuePerMonth,
          id: isNewCategory && i === 0 ? groupId : editItem.id || groupId,
          groupId: groupId,
          totalMonths: newMonths,
          repeatMode: repeatMode,
          categoryType: categoryType,
          installmentLabel:
            newMonths > 1
              ? repeatMode === "split"
                ? `${i + 1}/${newMonths}`
                : "Fixo"
              : null,
        };
        delete categoryData.installments;

        const data = docSnap.exists() ? docSnap.data() : { categories: [] };
        let cats = [...(data.categories || [])];
        const existsIndex = cats.findIndex(
          (c) =>
            c.id === categoryData.id ||
            (c.groupId === groupId &&
              c.installmentLabel === categoryData.installmentLabel),
        );

        if (existsIndex > -1) {
          cats[existsIndex] = categoryData;
        } else {
          cats.push(categoryData);
        }
        await setDoc(targetRef, { categories: cats }, { merge: true });
      }

      if (!isNewCategory && newMonths < oldMonths) {
        for (let i = newMonths; i < oldMonths; i++) {
          const [y, m] = selectedMonthId.split("-").map(Number);
          const date = new Date(y, m - 1 + i, 1);
          const targetMonthId = date.toISOString().slice(0, 7);
          const targetRef = doc(
            db,
            "users",
            user.uid,
            "monthlyBudgets",
            targetMonthId,
          );
          const docSnap = await getDoc(targetRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const updatedCats = data.categories.filter(
              (c: any) => c.groupId !== groupId,
            );
            await setDoc(
              targetRef,
              { categories: updatedCats },
              { merge: true },
            );
          }
        }
      }
      setModalVisible(false);
    } catch (error) {
      showAlert({
        title: "FALHA NA SINCRONIA",
        message: "Erro ao salvar dados.",
        type: "error",
        onConfirm: () => {},
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const ref = doc(db, "users", user.uid, "monthlyBudgets", selectedMonthId);
      const updated = budget.categories.filter(
        (c: any) => c.id !== editItem.id,
      );
      await setDoc(ref, { categories: updated }, { merge: true });
      setModalVisible(false);
    } catch (e) {
      console.error(e);
    }
  };

  const totalIncome =
    budget?.categories
      ?.filter((c: any) => c.categoryType === "income")
      .reduce((acc: number, cat: any) => acc + (cat.value || 0), 0) || 0;
  const totalExpenses =
    budget?.categories
      ?.filter((c: any) => c.categoryType !== "income")
      .reduce((acc: number, cat: any) => acc + (cat.value || 0), 0) || 0;
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={animatedContentStyle}>
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
            ) : (
              <>
                <View
                  style={[
                    styles.mainCard,
                    {
                      borderColor: remaining < 0 ? theme.error : theme.primary,
                    },
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
                  <View
                    style={{ flexDirection: "row", gap: 20, marginTop: 10 }}
                  >
                    <Text style={{ color: "#4ade80", fontSize: 12 }}>
                      Ganhos: {formatCurrency(totalIncome)}
                    </Text>
                    <Text style={{ color: theme.error, fontSize: 12 }}>
                      Gastos: {formatCurrency(totalExpenses)}
                    </Text>
                  </View>
                </View>

                <View style={styles.grid}>
                  {sortedCategories.map((cat: any) => (
                    <CategoryCard
                      key={cat.id}
                      cat={cat}
                      styles={styles}
                      theme={theme}
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
                        installments: "1",
                        categoryType: "expense",
                      },
                      true,
                    )
                  }
                >
                  <Text style={styles.addButtonText}>
                    + Adicionar Novo Item
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </GestureDetector>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isNewCategory ? "Novo Item" : editItem?.name}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.repeatSelector, { marginBottom: 15 }]}>
              <TouchableOpacity
                style={[
                  styles.repeatTab,
                  categoryType === "income" && {
                    backgroundColor: theme.primary,
                  },
                ]}
                onPress={() => setCategoryType("income")}
              >
                <Text
                  style={[
                    styles.repeatTabText,
                    categoryType === "income" && styles.repeatTabTextActive,
                  ]}
                >
                  Ganhos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.repeatTab,
                  categoryType === "expense" && styles.repeatTabActive,
                ]}
                onPress={() => setCategoryType("expense")}
              >
                <Text
                  style={[
                    styles.repeatTabText,
                    categoryType === "expense" && styles.repeatTabTextActive,
                  ]}
                >
                  Despesa
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.repeatTab,
                  categoryType === "investment" && styles.repeatTabActive,
                ]}
                onPress={() => setCategoryType("investment")}
              >
                <Text
                  style={[
                    styles.repeatTabText,
                    categoryType === "investment" && styles.repeatTabTextActive,
                  ]}
                >
                  Investimento
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { marginBottom: 15 }]}
              placeholder="Nome"
              placeholderTextColor={theme.secondary}
              value={editItem?.name}
              onChangeText={(t) => setEditItem({ ...editItem, name: t })}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 2 }}>
                <Text style={styles.label}>Valor Total (R$)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  placeholderTextColor={theme.secondary}
                  value={inputValue}
                  onChangeText={(t) => {
                    setInputValue(t);
                    setEditItem({
                      ...editItem,
                      value: parseFloat(t.replace(",", ".")) || 0,
                    });
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Meses</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editItem?.installments}
                  onChangeText={(t) =>
                    setEditItem({ ...editItem, installments: t })
                  }
                />
              </View>
            </View>

            <View style={styles.repeatSelector}>
              <TouchableOpacity
                style={[
                  styles.repeatTab,
                  repeatMode === "split" && styles.repeatTabActive,
                ]}
                onPress={() => setRepeatMode("split")}
              >
                <Text
                  style={[
                    styles.repeatTabText,
                    repeatMode === "split" && styles.repeatTabTextActive,
                  ]}
                >
                  Parcelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.repeatTab,
                  repeatMode === "replicate" && styles.repeatTabActive,
                ]}
                onPress={() => setRepeatMode("replicate")}
              >
                <Text
                  style={[
                    styles.repeatTabText,
                    repeatMode === "replicate" && styles.repeatTabTextActive,
                  ]}
                >
                  Replicar
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: 20, marginBottom: 10 }]}>
              Configurações Visuais
            </Text>
            <FlatList
              data={ICON_LIST}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.iconBox,
                    editItem?.icon === item.name && {
                      borderColor: theme.primary,
                    },
                  ]}
                  onPress={() => setEditItem({ ...editItem, icon: item.name })}
                >
                  <item.lib
                    color={
                      editItem?.icon === item.name
                        ? theme.primary
                        : theme.secondary
                    }
                    size={22}
                  />
                </TouchableOpacity>
              )}
            />
            <FlatList
              data={PRESET_COLORS}
              horizontal
              style={{ marginTop: 15 }}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: item,
                      borderWidth: editItem?.color === item ? 3 : 0,
                      borderColor: theme.text,
                    },
                  ]}
                  onPress={() => setEditItem({ ...editItem, color: item })}
                />
              )}
            />

            <TouchableOpacity
              style={[styles.saveButton, isSaving && { opacity: 0.8 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isNewCategory ? "CONFIRMAR E SALVAR" : "ATUALIZAR"}
                </Text>
              )}
            </TouchableOpacity>

            {!isNewCategory && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={isSaving}
              >
                <Trash2 color={theme.error} size={20} />
                <Text style={{ color: theme.error, fontWeight: "bold" }}>
                  EXCLUIR
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
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
    card: {
      backgroundColor: theme.card,
      width: "48%",
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      gap: 6,
      position: "relative",
    },
    cardTitle: { color: theme.secondary, fontSize: 11 },
    cardValue: { fontSize: 15, fontWeight: "bold" },
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.85)",
      justifyContent: "center",
      padding: 25,
    },
    modalContent: {
      backgroundColor: theme.card,
      borderRadius: 25,
      padding: 25,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    modalTitle: { color: theme.text, fontSize: 20, fontWeight: "bold" },
    input: {
      backgroundColor: theme.background,
      color: theme.text,
      padding: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    iconBox: {
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 10,
    },
    colorCircle: { width: 35, height: 35, borderRadius: 20, marginRight: 10 },
    saveButton: {
      backgroundColor: theme.primary,
      padding: 20,
      borderRadius: 15,
      alignItems: "center",
      marginTop: 30,
    },
    saveButtonText: { color: theme.background, fontWeight: "bold" },
    deleteButton: {
      marginTop: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    repeatSelector: {
      flexDirection: "row",
      backgroundColor: theme.background,
      borderRadius: 12,
      marginTop: 15,
      padding: 4,
    },
    repeatTab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 10,
    },
    repeatTabActive: { backgroundColor: theme.primary },
    repeatTabText: { color: theme.secondary, fontSize: 12, fontWeight: "bold" },
    repeatTabTextActive: { color: theme.background },
  });

function CategoryCard({ cat, styles, theme, onPress }: any) {
  const IconComp = ICON_LIST.find((i) => i.name === cat.icon)?.lib || Target;
  const color = cat.color || theme.text;

  const isInvestment = cat.categoryType === "investment";
  const isIncome = cat.categoryType === "income";
  const TypeIcon = isIncome ? Wallet : isInvestment ? TrendingUp : TrendingDown;

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: color }]}
      onPress={onPress}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <IconComp color={color} size={20} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
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
