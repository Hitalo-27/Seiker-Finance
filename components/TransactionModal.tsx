import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Trash2,
  Wallet,
  TrendingDown,
  TrendingUp,
  Target,
  Calendar,
  Repeat,
  Divide,
  Save,
  Check,
  Banknote,
} from "lucide-react-native";
import { Category, CategoryType, RepeatMode } from "../types/budget";
import { ICON_LIST, getThemeColor } from "../constants/icons";
import { ColorWheelPicker } from "./ColorWheelPicker";

const formatCurrency = (text: string) => {
  const digits = text.replace(/\D/g, "");
  if (!digits) return "";
  const numericValue = parseInt(digits, 10) / 100;
  const parts = numericValue.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.join(",");
};

const formatBRL = (value: number) => {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (item: Category, repeatMode: RepeatMode, newMonths: number) => Promise<void>;
  onDelete: (item: Category) => Promise<void>;
  initialItem: Category | null;
  isNew: boolean;
  theme: any;
  themeMode: string;
  isSaving: boolean;
}

export function TransactionModal({
  visible,
  onClose,
  onSave,
  onDelete,
  initialItem,
  isNew,
  theme,
  themeMode,
  isSaving,
}: Props) {
  const isDark = themeMode === "dark";
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [editItem, setEditItem] = useState<Category | null>(null);
  const [categoryType, setCategoryType] = useState<CategoryType>("expense");
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("split");
  const [inputValue, setInputValue] = useState("");
  const [installments, setInstallments] = useState("1");

  useEffect(() => {
    if (visible && initialItem) {
      const savedMonths = initialItem.totalMonths || 1;
      const savedMode = initialItem.repeatMode || "split";
      const savedType = initialItem.categoryType || "expense";

      const totalValue =
        savedMode === "split"
          ? initialItem.value * savedMonths
          : initialItem.value;

      setEditItem({
        ...initialItem,
        value: totalValue,
      });

      setCategoryType(savedType);
      setRepeatMode(savedMode);
      setInstallments(isNew ? "1" : String(savedMonths));
      setInputValue(
        totalValue > 0 ? formatCurrency(String(totalValue.toFixed(2))) : "",
      );
    }
  }, [visible, initialItem, isNew]);

  const handleSave = () => {
    if (!editItem) return;
    const newMonths = parseInt(installments) || 1;
    const itemToSave = { ...editItem, categoryType };
    onSave(itemToSave, repeatMode, newMonths);
  };

  const handleDelete = () => {
    if (!editItem) return;
    onDelete(editItem);
  };

  if (!editItem) return null;

  const activeColor = getThemeColor(
    editItem.color || theme.primary,
    themeMode as "dark" | "light",
  );
  const SelectedIconComp =
    ICON_LIST.find((i) => i.name === editItem.icon)?.lib || Target;

  const parsedMonths = Math.max(1, parseInt(installments) || 1);
  const monthlyPreviewValue =
    repeatMode === "split"
      ? (editItem.value || 0) / parsedMonths
      : editItem.value || 0;

  const modalGradient: [string, string] = isDark
    ? [activeColor + "16", theme.card]
    : [activeColor + "10", theme.card];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View
          style={[
            styles.modalWrapper,
            {
              borderColor: activeColor + (isDark ? "66" : "55"),
              shadowColor: activeColor,
            },
          ]}
        >
          <LinearGradient
            colors={modalGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalContent}
          >
            <View
              style={[
                styles.decorativeCircle,
                { backgroundColor: activeColor + (isDark ? "12" : "14") },
              ]}
            />

            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.headerIconBadge,
                    {
                      backgroundColor: activeColor + (isDark ? "28" : "20"),
                      borderColor: activeColor + "55",
                    },
                  ]}
                >
                  <SelectedIconComp color={activeColor} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {isNew ? "Novo Item" : editItem.name || "Editar Item"}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {isNew
                      ? "Adicione uma nova movimentação"
                      : "Atualize os dados da categoria"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color={theme.text} size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.sectionLabel}>TIPO DE MOVIMENTAÇÃO</Text>
              <View style={styles.segmentedControl}>
                {[
                  {
                    id: "income" as CategoryType,
                    label: "Ganhos",
                    icon: Wallet,
                    color: theme.success,
                  },
                  {
                    id: "expense" as CategoryType,
                    label: "Despesa",
                    icon: TrendingDown,
                    color: theme.error,
                  },
                  {
                    id: "investment" as CategoryType,
                    label: "Invest.",
                    icon: TrendingUp,
                    color: theme.warning,
                  },
                ].map((type) => {
                  const isSelected = categoryType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.segmentTab,
                        isSelected && { backgroundColor: type.color },
                      ]}
                      onPress={() => setCategoryType(type.id)}
                    >
                      <type.icon
                        size={14}
                        color={isSelected ? theme.background : theme.secondary}
                      />
                      <Text
                        style={[
                          styles.segmentTabText,
                          isSelected && styles.segmentTabTextActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>NOME DA CATEGORIA</Text>
              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputIconBadge,
                    { backgroundColor: activeColor + "20" },
                  ]}
                >
                  <SelectedIconComp size={16} color={activeColor} />
                </View>
                <TextInput
                  style={styles.inputField}
                  placeholder="Ex: Salário, Aluguel, Mercado..."
                  placeholderTextColor={theme.secondary}
                  value={editItem.name}
                  onChangeText={(t) => setEditItem({ ...editItem, name: t })}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={{ flex: 1.8 }}>
                  <Text style={styles.sectionLabel}>VALOR TOTAL (R$)</Text>
                  <View style={styles.inputContainer}>
                    <View
                      style={[
                        styles.inputIconBadge,
                        { backgroundColor: theme.primary + "20" },
                      ]}
                    >
                      <Banknote size={16} color={theme.primary} />
                    </View>
                    <TextInput
                      style={styles.inputField}
                      keyboardType="numeric"
                      placeholder="0,00"
                      placeholderTextColor={theme.secondary}
                      value={inputValue}
                      onChangeText={(t) => {
                        const formatted = formatCurrency(t);
                        setInputValue(formatted);

                        const digits = formatted.replace(/\D/g, "");
                        const numericValue = digits
                          ? parseInt(digits, 10) / 100
                          : 0;

                        setEditItem({
                          ...editItem,
                          value: numericValue,
                        });
                      }}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionLabel}>MESES</Text>
                  <View style={styles.inputContainer}>
                    <View
                      style={[
                        styles.inputIconBadge,
                        { backgroundColor: theme.primary + "20" },
                      ]}
                    >
                      <Calendar size={15} color={theme.primary} />
                    </View>
                    <TextInput
                      style={[styles.inputField, { textAlign: "center" }]}
                      keyboardType="numeric"
                      value={installments}
                      onChangeText={setInstallments}
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.sectionLabel}>MODO DE REPETIÇÃO</Text>
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentTab,
                    repeatMode === "split" && styles.segmentTabPrimaryActive,
                  ]}
                  onPress={() => setRepeatMode("split")}
                >
                  <Divide
                    size={14}
                    color={
                      repeatMode === "split"
                        ? theme.background
                        : theme.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.segmentTabText,
                      repeatMode === "split" && styles.segmentTabTextActive,
                    ]}
                  >
                    Parcelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentTab,
                    repeatMode === "replicate" &&
                      styles.segmentTabPrimaryActive,
                  ]}
                  onPress={() => setRepeatMode("replicate")}
                >
                  <Repeat
                    size={14}
                    color={
                      repeatMode === "replicate"
                        ? theme.background
                        : theme.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.segmentTabText,
                      repeatMode === "replicate" && styles.segmentTabTextActive,
                    ]}
                  >
                    Replicar
                  </Text>
                </TouchableOpacity>
              </View>

              {parsedMonths > 1 && (editItem.value || 0) > 0 && (
                <View
                  style={[
                    styles.previewBanner,
                    {
                      backgroundColor: activeColor + "14",
                      borderColor: activeColor + "40",
                    },
                  ]}
                >
                  <Text style={[styles.previewBannerText, { color: theme.text }]}>
                    {repeatMode === "split"
                      ? `${parsedMonths}x parcelas de `
                      : `Repetir por ${parsedMonths} meses: `}
                    <Text style={{ color: activeColor, fontWeight: "800" }}>
                      {formatBRL(monthlyPreviewValue)}/mês
                    </Text>
                  </Text>
                </View>
              )}

              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                ÍCONE DA CATEGORIA
              </Text>
              <ScrollView
                horizontal
                nestedScrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 2 }}
              >
                {ICON_LIST.map((item) => {
                  const isSelected = editItem.icon === item.name;
                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[
                        styles.iconBox,
                        isSelected && {
                          borderColor: activeColor,
                          backgroundColor: activeColor + "24",
                        },
                      ]}
                      onPress={() =>
                        setEditItem({ ...editItem, icon: item.name })
                      }
                    >
                      <item.lib
                        color={isSelected ? activeColor : theme.secondary}
                        size={20}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <ColorWheelPicker
                color={editItem.color || theme.primary}
                onColorChange={(hex) =>
                  setEditItem((prev) => (prev ? { ...prev, color: hex } : prev))
                }
                theme={theme}
              />

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: theme.primary,
                    shadowColor: theme.primary,
                  },
                  isSaving && { opacity: 0.8 },
                ]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <>
                    {isNew ? (
                      <Check size={18} color={theme.background} />
                    ) : (
                      <Save size={18} color={theme.background} />
                    )}
                    <Text style={styles.saveButtonText}>
                      {isNew ? "CONFIRMAR E SALVAR" : "SALVAR ALTERAÇÕES"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {!isNew && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  disabled={isSaving}
                >
                  <Trash2 color={theme.error} size={17} />
                  <Text style={styles.deleteButtonText}>EXCLUIR ITEM</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.82)",
      justifyContent: "center",
      padding: 20,
    },
    modalWrapper: {
      width: "100%",
      maxHeight: "88%",
      borderRadius: 28,
      borderWidth: 1.5,
      backgroundColor: theme.card,
      overflow: "hidden",
      elevation: 10,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.18,
      shadowRadius: 14,
    },
    modalContent: {
      maxHeight: "100%",
      flexShrink: 1,
      padding: 22,
      position: "relative",
      overflow: "hidden",
    },
    scrollArea: {
      flexGrow: 0,
    },
    scrollContent: {
      paddingBottom: 12,
    },
    decorativeCircle: {
      position: "absolute",
      width: 170,
      height: 170,
      borderRadius: 85,
      right: -50,
      top: -50,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 14,
      marginBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
      marginRight: 10,
    },
    headerIconBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    modalTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.2,
    },
    modalSubtitle: {
      color: theme.secondary,
      fontSize: 11,
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionLabel: {
      color: theme.secondary,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.9,
      marginBottom: 6,
      marginLeft: 2,
    },
    segmentedControl: {
      flexDirection: "row",
      backgroundColor: theme.background,
      borderRadius: 14,
      padding: 4,
      gap: 4,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 14,
    },
    segmentTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
    },
    segmentTabPrimaryActive: {
      backgroundColor: theme.primary,
    },
    segmentTabText: {
      color: theme.secondary,
      fontSize: 12,
      fontWeight: "800",
    },
    segmentTabTextActive: {
      color: theme.background,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 10,
      height: 48,
      marginBottom: 14,
    },
    inputIconBadge: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    inputField: {
      flex: 1,
      color: theme.text,
      fontSize: 15,
      fontWeight: "700",
      paddingVertical: 0,
    },
    rowInputs: {
      flexDirection: "row",
      gap: 10,
    },
    previewBanner: {
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      marginTop: -4,
      marginBottom: 4,
    },
    previewBannerText: {
      fontSize: 12,
      fontWeight: "600",
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
      marginRight: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    saveButton: {
      flexDirection: "row",
      paddingVertical: 16,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 22,
      elevation: 4,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
    },
    saveButtonText: {
      color: theme.background,
      fontWeight: "800",
      fontSize: 14,
      letterSpacing: 0.5,
    },
    deleteButton: {
      marginTop: 12,
      paddingVertical: 13,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.error + "44",
      backgroundColor: isDark
        ? "rgba(255, 82, 82, 0.1)"
        : "rgba(229, 57, 53, 0.08)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    deleteButtonText: {
      color: theme.error,
      fontWeight: "800",
      fontSize: 13,
      letterSpacing: 0.5,
    },
  });
