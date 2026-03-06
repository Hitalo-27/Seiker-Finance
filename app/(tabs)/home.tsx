import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  useColorScheme,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  ShoppingBag,
  Coffee,
  Car,
  Home as HomeIcon,
  Heart,
  Trash2,
} from "lucide-react-native";
import { auth, db } from "../../FirebaseConfig";
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from "firebase/firestore";
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

const ICON_LIST = [
  { name: "Target", lib: Target },
  { name: "TrendingUp", lib: TrendingUp },
  { name: "TrendingDown", lib: TrendingDown },
  { name: "Wallet", lib: Wallet },
  { name: "ShoppingBag", lib: ShoppingBag },
  { name: "Coffee", lib: Coffee },
  { name: "Car", lib: Car },
  { name: "Home", lib: HomeIcon },
  { name: "Heart", lib: Heart },
];

const PRESET_COLORS = [
  "#00F5FF",
  "#FF00E5",
  "#00FF85",
  "#A020F0",
  "#FFB800",
  "#FF5252",
  "#FFFFFF",
  "#8B4513",
  "#000000",
  "#F50",
  "#808080",
  "#003366",
  "#006400",
];

export default function Home() {
  const {selectedMonthId, setSelectedMonthId} = useMonth();
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);

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

  const animatedContentStyle = useAnimatedStyle(() => ({
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
      if (docSnap.exists()) {
        setBudget(docSnap.data());
      } else {
        initializeMonth(user.uid, selectedMonthId);
      }
      setLoading(false);
    });
  }, [selectedMonthId]);

  const initializeMonth = async (uid: string, monthId: string) => {
    const docRef = doc(db, "users", uid, "monthlyBudgets", monthId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        income: 0,
        categories: [
          {
            id: "fixed",
            name: "Contas Fixas",
            value: 0,
            color: "#FFB800",
            icon: "Target",
          },
          {
            id: "leisure",
            name: "Lazer",
            value: 0,
            color: "#00FF85",
            icon: "TrendingDown",
          },
        ],
      });
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user || !editItem) return;

    const numInstallments = parseInt(editItem.installments) || 1;
    const dividedValue = editItem.value / numInstallments;
    const groupId = editItem.groupId || Date.now().toString();

    for (let i = 0; i < numInstallments; i++) {
      const [y, m] = selectedMonthId.split("-").map(Number);
      const date = new Date(y, m - 1 + i, 1);
      const targetMonthId = date.toISOString().slice(0, 7);

      const ref = doc(db, "users", user.uid, "monthlyBudgets", targetMonthId);
      const docSnap = await getDoc(ref);

      const categoryData = {
        ...editItem,
        value: dividedValue,
        id: isNewCategory && i === 0 ? groupId : editItem.id || groupId,
        groupId: groupId,
        installmentLabel:
          numInstallments > 1 ? `${i + 1}/${numInstallments}` : null,
      };
      delete categoryData.installments;

      if (editItem.id === "salary") {
        await updateDoc(ref, { income: editItem.value });
      } else {
        if (!docSnap.exists()) {
          await setDoc(ref, { income: 0, categories: [categoryData] });
        } else {
          const data = docSnap.data();
          let cats = [...(data.categories || [])];
          if (isNewCategory) cats.push(categoryData);
          else
            cats = cats.map((c: any) =>
              c.id === editItem.id ? categoryData : c,
            );
          await updateDoc(ref, { categories: cats });
        }
      }
    }
    setModalVisible(false);
  };

  const handleDelete = async () => {
    Alert.alert("Excluir", `Deseja remover "${editItem.name}"?`, [
      { text: "Não", style: "cancel" },
      {
        text: "Sim, Excluir",
        style: "destructive",
        onPress: async () => {
          const user = auth.currentUser;
          if (!user) return;
          const ref = doc(
            db,
            "users",
            user.uid,
            "monthlyBudgets",
            selectedMonthId,
          );
          const updated = budget.categories.filter(
            (c: any) => c.id !== editItem.id,
          );
          await updateDoc(ref, { categories: updated });
          setModalVisible(false);
        },
      },
    ]);
  };

  const totalExpenses =
    budget?.categories?.reduce(
      (acc: number, cat: any) => acc + (cat.value || 0),
      0,
    ) || 0;
  const remaining = (budget?.income || 0) - totalExpenses;

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
                    R$ {remaining.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.grid}>
                  <TouchableOpacity
                    style={[styles.card, { borderColor: theme.primary }]}
                    onPress={() => {
                      setEditItem({
                        id: "salary",
                        name: "Renda Mensal",
                        value: budget?.income || 0,
                        color: theme.primary,
                        icon: "Wallet",
                      });
                      setIsNewCategory(false);
                      setModalVisible(true);
                    }}
                  >
                    <Wallet color={theme.primary} size={20} />
                    <Text style={styles.cardTitle}>Renda Mensal</Text>
                    <Text style={[styles.cardValue, { color: theme.primary }]}>
                      R$ {(budget?.income || 0).toFixed(2)}
                    </Text>
                  </TouchableOpacity>

                  {budget?.categories?.map((cat: any) => (
                    <CategoryCard
                      key={cat.id}
                      cat={cat}
                      styles={styles}
                      onPress={() => {
                        setEditItem(cat);
                        setIsNewCategory(false);
                        setModalVisible(true);
                      }}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    setEditItem({
                      name: "",
                      value: 0,
                      color: "#FFFFFF",
                      icon: "Target",
                      installments: "1",
                    });
                    setIsNewCategory(true);
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.addButtonText}>
                    + Adicionar Categoria
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </GestureDetector>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isNewCategory ? "Novo Item" : editItem?.name}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { marginBottom: 15 }]}
              placeholder="Nome"
              placeholderTextColor={theme.secondary}
              value={editItem?.name}
              onChangeText={(t) => setEditItem({ ...editItem, name: t })}
              editable={editItem?.id !== "salary"}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 2 }}>
                <Text style={styles.label}>Valor Total (R$)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(editItem?.value || "")}
                  onChangeText={(t) =>
                    setEditItem({ ...editItem, value: parseFloat(t) || 0 })
                  }
                />
              </View>
              {isNewCategory && editItem?.id !== "salary" && (
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Parcelas</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={editItem?.installments}
                    onChangeText={(t) =>
                      setEditItem({ ...editItem, installments: t })
                    }
                  />
                </View>
              )}
            </View>

            {editItem?.id !== "salary" && (
              <>
                <Text
                  style={[styles.label, { marginTop: 20, marginBottom: 10 }]}
                >
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
                      onPress={() =>
                        setEditItem({ ...editItem, icon: item.name })
                      }
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
              </>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {isNewCategory ? "SALVAR TUDO" : "ATUALIZAR"}
              </Text>
            </TouchableOpacity>

            {!isNewCategory && editItem?.id !== "salary" && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Trash2 color={theme.error} size={20} />
                <Text style={{ color: theme.error, fontWeight: "bold" }}>
                  EXCLUIR
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function CategoryCard({ cat, styles, onPress }: any) {
  const IconComp = ICON_LIST.find((i) => i.name === cat.icon)?.lib || Target;
  const color = cat.color || "#FFFFFF";
  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: color }]}
      onPress={onPress}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <IconComp color={color} size={20} />
        {cat.installmentLabel && (
          <Text style={{ color: color, fontSize: 10, fontWeight: "bold" }}>
            {cat.installmentLabel}
          </Text>
        )}
      </View>
      <Text style={styles.cardTitle}>{cat.name}</Text>
      <Text style={[styles.cardValue, { color: color }]}>
        R$ {cat.value?.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
}

const formatMonthTitle = (id: string) => {
  const [y, m] = id.split("-").map(Number);
  return new Date(y, m - 1).toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  });
};

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
    mainCard: {
      backgroundColor: theme.card,
      padding: 30,
      borderRadius: 24,
      borderWidth: 2,
      alignItems: "center",
      marginBottom: 25,
    },
    label: { color: theme.secondary, fontSize: 11, marginBottom: 4 },
    balanceValue: { fontSize: 42, fontWeight: "bold", marginTop: 5 },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      justifyContent: "space-between",
    },
    card: {
      backgroundColor: theme.card,
      width: "48%",
      padding: 20,
      borderRadius: 18,
      borderWidth: 1,
      gap: 8,
    },
    cardTitle: { color: theme.secondary, fontSize: 11 },
    cardValue: { fontSize: 17, fontWeight: "bold" },
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
  });
