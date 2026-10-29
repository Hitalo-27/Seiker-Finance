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
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
  Wallet,
  TrendingDown,
  TrendingUp,
  Save,
  Sparkles,
} from "lucide-react-native";
import { auth, db } from "../FirebaseConfig";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { Colors } from "../constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useMonth } from "@/context/MonthContext";
import { useRouter, usePathname } from "expo-router";
import { ICON_LIST, getThemeColor } from "../constants/icons";
import { ColorWheelPicker } from "./ColorWheelPicker";
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
  const pathname = usePathname();
  const { theme: themeMode, toggleTheme } = useTheme();
  const isDark = themeMode === "dark";
  const theme = Colors[themeMode as keyof typeof Colors];
  const { selectedMonthId, setSelectedMonthId } = useMonth();

  const [menuVisible, setMenuVisible] = useState(false);
  const [templateModal, setTemplateModal] = useState(false);
  const [templateCategories, setTemplateCategories] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  const user = auth.currentUser;
  const isProfilePage = pathname === "/profile";

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
      await updateDoc(userRef, { categoryTemplate: templateCategories });
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
        message: "Template salvo!",
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

  if (isProfilePage) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity onPress={toggleTheme}>
        {themeMode === "dark" ? (
          <Sun color={theme.primary} size={26} />
        ) : (
          <Moon color={theme.primary} size={26} />
        )}
      </TouchableOpacity>

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
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.headerAvatar} />
        ) : (
          <User color={theme.primary} size={28} />
        )}
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
              <TouchableOpacity
                onPress={() => setPickerYear(pickerYear - 1)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 50 }}
              >
                <ChevronLeft color={theme.primary} size={24} />
              </TouchableOpacity>
              <Text style={[styles.pickerYearText, { color: theme.text }]}>
                {pickerYear}
              </Text>
              <TouchableOpacity
                onPress={() => setPickerYear(pickerYear + 1)}
                hitSlop={{ top: 20, bottom: 20, left: 50, right: 20 }}
              >
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
            <TouchableOpacity style={styles.menuItem} onPress={loadTemplate}>
              <Target color={theme.primary} size={18} />
              <Text style={{ color: theme.text }}>Meu Template</Text>
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
              {
                backgroundColor: theme.card,
                borderColor: theme.primary + (isDark ? "66" : "44"),
              },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: theme.border },
              ]}
            >
              <View style={styles.modalHeaderLeft}>
                <View
                  style={[
                    styles.modalHeaderBadge,
                    {
                      backgroundColor: theme.primary + (isDark ? "22" : "18"),
                      borderColor: theme.primary + "44",
                    },
                  ]}
                >
                  <Target size={20} color={theme.primary} />
                </View>
                <View>
                  <View style={styles.modalTitleRow}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>
                      Meu Template
                    </Text>
                    <View
                      style={[
                        styles.countBadge,
                        { backgroundColor: theme.primary + "20" },
                      ]}
                    >
                      <Text
                        style={[styles.countBadgeText, { color: theme.primary }]}
                      >
                        {templateCategories.length}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.modalSubtitle, { color: theme.secondary }]}
                  >
                    Categorias base para iniciar seus meses
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setTemplateModal(false)}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                <X color={theme.text} size={18} />
              </TouchableOpacity>
            </View>

            <FlatList
              ref={flatListRef}
              data={templateCategories}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.templateListContent}
              keyExtractor={(_, index) => index.toString()}
              ListEmptyComponent={
                <View style={styles.emptyTemplateBox}>
                  <View
                    style={[
                      styles.emptyTemplateIcon,
                      { backgroundColor: theme.primary + "18" },
                    ]}
                  >
                    <Sparkles size={24} color={theme.primary} />
                  </View>
                  <Text
                    style={[styles.emptyTemplateTitle, { color: theme.text }]}
                  >
                    Nenhuma categoria no template
                  </Text>
                  <Text
                    style={[
                      styles.emptyTemplateSub,
                      { color: theme.secondary },
                    ]}
                  >
                    Toque no botão abaixo para adicionar categorias que serão criadas automaticamente a cada novo mês.
                  </Text>
                </View>
              }
              renderItem={({ item, index }) => {
                const resolvedColor = getThemeColor(
                  item.color || theme.primary,
                  themeMode as "dark" | "light",
                );
                const SelectedIconComp =
                  ICON_LIST.find((i) => i.name === item.icon)?.lib || Target;

                const cardColors: [string, string] = isDark
                  ? [resolvedColor + "18", theme.background]
                  : [resolvedColor + "12", theme.background];

                return (
                  <View
                    style={[
                      styles.templateCardWrapper,
                      {
                        borderColor: resolvedColor + (isDark ? "55" : "44"),
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={cardColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.templateCard}
                    >
                      <View
                        style={[
                          styles.templateAccentBar,
                          { backgroundColor: resolvedColor },
                        ]}
                      />

                      <View style={styles.templateHeaderRow}>
                        <View
                          style={[
                            styles.previewIconBadge,
                            {
                              backgroundColor:
                                resolvedColor + (isDark ? "28" : "20"),
                              borderColor: resolvedColor + "55",
                            },
                          ]}
                        >
                          <SelectedIconComp color={resolvedColor} size={18} />
                        </View>

                        <View
                          style={[
                            styles.templateInputContainer,
                            {
                              backgroundColor: theme.card,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <TextInput
                            style={[styles.templateInput, { color: theme.text }]}
                            value={item.name}
                            placeholder="Nome da categoria..."
                            placeholderTextColor={theme.secondary}
                            onChangeText={(text) => {
                              const newCats = [...templateCategories];
                              newCats[index].name = text;
                              setTemplateCategories(newCats);
                            }}
                          />
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.deleteItemBtn,
                            {
                              backgroundColor: theme.error + "18",
                              borderColor: theme.error + "38",
                            },
                          ]}
                          onPress={() =>
                            setTemplateCategories(
                              templateCategories.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <Trash2 color={theme.error} size={17} />
                        </TouchableOpacity>
                      </View>

                      <View
                        style={[
                          styles.typeSelector,
                          {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        {[
                          {
                            id: "income",
                            label: "Ganhos",
                            icon: Wallet,
                            color: theme.success,
                          },
                          {
                            id: "expense",
                            label: "Despesa",
                            icon: TrendingDown,
                            color: theme.error,
                          },
                          {
                            id: "investment",
                            label: "Invest.",
                            icon: TrendingUp,
                            color: theme.warning,
                          },
                        ].map((type) => {
                          const isSelected =
                            item.categoryType === type.id ||
                            (!item.categoryType && type.id === "expense");
                          return (
                            <TouchableOpacity
                              key={type.id}
                              style={[
                                styles.typeTab,
                                isSelected && { backgroundColor: type.color },
                              ]}
                              onPress={() => {
                                const newCats = [...templateCategories];
                                newCats[index].categoryType = type.id;
                                setTemplateCategories(newCats);
                              }}
                            >
                              <type.icon
                                size={13}
                                color={
                                  isSelected
                                    ? theme.background
                                    : theme.secondary
                                }
                              />
                              <Text
                                style={[
                                  styles.typeTabText,
                                  {
                                    color: isSelected
                                      ? theme.background
                                      : theme.secondary,
                                  },
                                ]}
                              >
                                {type.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text
                        style={[
                          styles.fieldMiniLabel,
                          { color: theme.secondary },
                        ]}
                      >
                        ÍCONE DA CATEGORIA
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.horizontalSelector}
                      >
                        {ICON_LIST.map((icon) => {
                          const isSelectedIcon = item.icon === icon.name;
                          return (
                            <TouchableOpacity
                              key={icon.name}
                              style={[
                                styles.iconOption,
                                {
                                  backgroundColor: theme.card,
                                  borderColor: theme.border,
                                },
                                isSelectedIcon && {
                                  backgroundColor: resolvedColor + "28",
                                  borderColor: resolvedColor,
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
                                  isSelectedIcon
                                    ? resolvedColor
                                    : theme.secondary
                                }
                                size={19}
                              />
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>

                      <ColorWheelPicker
                        color={item.color || theme.primary}
                        onColorChange={(hex) => {
                          const newCats = [...templateCategories];
                          newCats[index] = { ...newCats[index], color: hex };
                          setTemplateCategories(newCats);
                        }}
                        theme={theme}
                      />
                    </LinearGradient>
                  </View>
                );
              }}
            />

            <View style={styles.modalFooterActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.addButton,
                  {
                    borderColor: theme.primary + "88",
                    backgroundColor: isDark
                      ? "rgba(0, 245, 255, 0.05)"
                      : "rgba(0, 172, 193, 0.05)",
                  },
                ]}
                onPress={() => {
                  setTemplateCategories([
                    ...templateCategories,
                    {
                      id: Date.now().toString(),
                      name: "",
                      value: 0,
                      color: theme.primary,
                      icon: "Target",
                      categoryType: "expense",
                    },
                  ]);
                  setTimeout(
                    () => flatListRef.current?.scrollToEnd({ animated: true }),
                    100,
                  );
                }}
              >
                <View
                  style={[
                    styles.addIconCircle,
                    { backgroundColor: theme.primary + "22" },
                  ]}
                >
                  <Plus size={16} color={theme.primary} />
                </View>
                <Text style={[styles.addButtonText, { color: theme.primary }]}>
                  Adicionar Categoria
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: theme.primary,
                    shadowColor: theme.primary,
                  },
                ]}
                onPress={saveTemplate}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <>
                    <Save size={18} color={theme.background} />
                    <Text
                      style={[
                        styles.saveButtonText,
                        { color: theme.background },
                      ]}
                    >
                      SALVAR TEMPLATE
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
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
    width: "94%",
    height: "90%",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1.5,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  modalHeaderBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  templateListContent: {
    paddingBottom: 8,
  },
  emptyTemplateBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTemplateIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTemplateTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyTemplateSub: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  templateCardWrapper: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
  },
  templateCard: {
    padding: 15,
    position: "relative",
    overflow: "hidden",
  },
  templateAccentBar: {
    position: "absolute",
    left: 0,
    top: 16,
    bottom: 16,
    width: 3.5,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  templateHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  previewIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  templateInputContainer: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
    justifyContent: "center",
  },
  templateInput: {
    fontSize: 14,
    fontWeight: "700",
    paddingVertical: 0,
  },
  deleteItemBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  typeSelector: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 4,
    borderWidth: 1,
  },
  typeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  typeTabText: {
    fontSize: 11,
    fontWeight: "800",
  },
  fieldMiniLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.9,
    marginTop: 12,
    marginBottom: 6,
    marginLeft: 2,
  },
  horizontalSelector: {
    marginBottom: 2,
  },
  iconOption: {
    width: 38,
    height: 38,
    borderRadius: 11,
    marginRight: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalFooterActions: {
    paddingTop: 10,
    gap: 10,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 15,
  },
  addIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontWeight: "700",
    fontSize: 13,
  },
  saveButton: {
    paddingVertical: 15,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  saveButtonText: {
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.6,
  },
});
