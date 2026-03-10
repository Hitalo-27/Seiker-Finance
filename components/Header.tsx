import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  FlatList,
  TextInput,
  ScrollView,
} from "react-native";
import {
  User,
  ChevronLeft,
  ChevronRight,
  Target,
  Trash2,
  X,
  Plus,
  Sun,
  Moon,
} from "lucide-react-native";
import { auth, db } from "../FirebaseConfig";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { Colors } from "../constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useMonth } from "@/context/MonthContext";
import { useRouter } from "expo-router";
import { ICON_LIST, PRESET_COLORS } from "../constants/icons";
import { useAlert } from "@/context/AlertContext";

const MONTHS = [
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

export default function GlobalHeader() {
  const router = useRouter();
  const { theme: themeMode, toggleTheme } = useTheme();
  const theme = Colors[themeMode as keyof typeof Colors];
  const { selectedMonthId, setSelectedMonthId } = useMonth();

  const [menuVisible, setMenuVisible] = useState(false);
  const [templateModal, setTemplateModal] = useState(false);
  const [templateCategories, setTemplateCategories] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  const flatListRef = useRef<FlatList>(null);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (selectedMonthId) {
      setPickerYear(parseInt(selectedMonthId.split("-")[0]));
    }
  }, [selectedMonthId, pickerVisible]);

  const changeMonth = (direction: number) => {
    const [y, m] = selectedMonthId.split("-").map(Number);
    const d = new Date(y, m - 1 + direction, 1);
    setSelectedMonthId(d.toISOString().slice(0, 7));
  };

  const selectMonthFromPicker = (monthIndex: number) => {
    const monthFormatted = String(monthIndex + 1).padStart(2, "0");
    setSelectedMonthId(`${pickerYear}-${monthFormatted}`);
    setPickerVisible(false);
  };

  const handleLogout = () => {
    auth.signOut();
    router.replace("/login");
  };

  const loadTemplate = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && userDoc.data().categoryTemplate) {
      setTemplateCategories(userDoc.data().categoryTemplate);
    }
    setTemplateModal(true);
    setMenuVisible(false);
  };

  const saveTemplate = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsSaving(true);

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        categoryTemplate: templateCategories,
      });

      const monthRef = doc(
        db,
        "users",
        user.uid,
        "monthlyBudgets",
        selectedMonthId,
      );
      const monthSnap = await getDoc(monthRef);
      const monthData = monthSnap.data();

      if (
        !monthSnap.exists() ||
        !monthData?.categories ||
        monthData.categories.length === 0
      ) {
        await setDoc(
          monthRef,
          { categories: templateCategories },
          { merge: true },
        );
      }

      setTemplateModal(false);
      showAlert({
        title: "Sucesso",
        message: "Template salvo e aplicado ao mês atual.",
        type: "success",
        onConfirm: () => {},
      });
    } catch (error) {
      showAlert({
        title: "Erro",
        message: "Falha ao salvar template.",
        type: "error",
        onConfirm: () => {},
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ width: 28 }} />

      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <ChevronLeft color={theme.primary} size={24} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setPickerVisible(true)}>
          <Text style={[styles.monthText, { color: theme.text }]}>
            {new Date(selectedMonthId + "-01T12:00:00").toLocaleString(
              "pt-BR",
              { month: "short", year: "numeric" },
            )}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => changeMonth(1)}>
          <ChevronRight color={theme.primary} size={24} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => setMenuVisible(true)}>
        <User color={theme.primary} size={28} />
      </TouchableOpacity>

      <Modal visible={pickerVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View
            style={[
              styles.pickerModal,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setPickerYear(pickerYear - 1)}>
                <ChevronLeft color={theme.primary} size={24} />
              </TouchableOpacity>
              <Text style={[styles.pickerYearText, { color: theme.text }]}>
                {pickerYear}
              </Text>
              <TouchableOpacity onPress={() => setPickerYear(pickerYear + 1)}>
                <ChevronRight color={theme.primary} size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.monthsGrid}>
              {MONTHS.map((month, index) => {
                const isSelected =
                  selectedMonthId ===
                  `${pickerYear}-${String(index + 1).padStart(2, "0")}`;
                return (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.monthButton,
                      isSelected && { backgroundColor: theme.primary },
                    ]}
                    onPress={() => selectMonthFromPicker(index)}
                  >
                    <Text
                      style={[
                        styles.monthButtonText,
                        { color: isSelected ? theme.background : theme.text },
                      ]}
                    >
                      {month}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[
              styles.menu,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
              {themeMode === "dark" ? (
                <Sun color={theme.primary} size={18} />
              ) : (
                <Moon color={theme.primary} size={18} />
              )}
              <Text style={{ color: theme.text }}>
                Tema {themeMode === "dark" ? "Claro" : "Escuro"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={loadTemplate}>
              <Target color={theme.primary} size={18} />
              <Text style={{ color: theme.text }}>Criar Template</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={handleLogout}
            >
              <Trash2 color={theme.error} size={18} />
              <Text style={{ color: theme.error }}>Sair</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={templateModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, borderColor: theme.primary },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={{ color: theme.text, fontSize: 18, fontWeight: "bold" }}
              >
                Configurar Template
              </Text>
              <TouchableOpacity onPress={() => setTemplateModal(false)}>
                <X color={theme.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              ref={flatListRef}
              data={templateCategories}
              showsVerticalScrollIndicator={false}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.templateCard,
                    { borderColor: item.color || theme.border },
                  ]}
                >
                  <View style={styles.templateHeaderRow}>
                    <TextInput
                      style={[styles.templateInput, { color: theme.text }]}
                      value={item.name}
                      placeholder="Nome da categoria"
                      placeholderTextColor={theme.secondary}
                      onChangeText={(text) => {
                        const newCats = [...templateCategories];
                        newCats[index].name = text;
                        setTemplateCategories(newCats);
                      }}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setTemplateCategories(
                          templateCategories.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 color={theme.error} size={20} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.horizontalSelector}
                  >
                    {ICON_LIST.map((icon) => (
                      <TouchableOpacity
                        key={icon.name}
                        style={[
                          styles.iconOption,
                          item.icon === icon.name && {
                            backgroundColor: theme.primary + "33",
                          },
                        ]}
                        onPress={() => {
                          const newCats = [...templateCategories];
                          newCats[index].icon = icon.name;
                          setTemplateCategories(newCats);
                        }}
                      >
                        <icon.lib
                          color={
                            item.icon === icon.name
                              ? theme.primary
                              : theme.secondary
                          }
                          size={20}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.horizontalSelector}
                  >
                    {PRESET_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          item.color === color && {
                            borderWidth: 2,
                            borderColor: theme.text,
                          },
                        ]}
                        onPress={() => {
                          const newCats = [...templateCategories];
                          newCats[index].color = color;
                          setTemplateCategories(newCats);
                        }}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}
            />

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setTemplateCategories([
                  ...templateCategories,
                  {
                    id: Date.now().toString(),
                    name: "Nova Categoria",
                    value: 0,
                    color: "#FFF",
                    icon: "Target",
                  },
                ]);
                setTimeout(
                  () => flatListRef.current?.scrollToEnd({ animated: true }),
                  100,
                );
              }}
            >
              <Plus color={theme.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={saveTemplate}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <Text style={{ fontWeight: "bold", color: theme.background }}>
                  SALVAR TEMPLATE
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  monthSelector: { flexDirection: "row", alignItems: "center", gap: 15 },
  monthText: { fontSize: 18, fontWeight: "bold", textTransform: "capitalize" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerModal: {
    width: "80%",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  pickerYearText: { fontSize: 20, fontWeight: "bold" },
  monthsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  monthButton: {
    width: "30%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  monthButtonText: { fontWeight: "bold", fontSize: 14 },
  menu: {
    position: "absolute",
    top: 100,
    right: 20,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    width: 180,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  modalContent: {
    width: "95%",
    height: "95%",
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  addButton: {
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#555",
    borderRadius: 10,
    marginTop: 10,
  },
  saveButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  templateCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  templateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  templateInput: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  horizontalSelector: {
    marginTop: 10,
  },
  iconOption: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  colorOption: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
  },
});
