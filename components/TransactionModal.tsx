import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { X, Trash2 } from 'lucide-react-native';
import { Category, CategoryType, RepeatMode } from '../types/budget';
import { ICON_LIST } from '../constants/icons';
import { ColorWheelPicker } from './ColorWheelPicker';

const formatCurrency = (text: string) => {
  const digits = text.replace(/\D/g, "");
  if (!digits) return "";
  const numericValue = parseInt(digits, 10) / 100;
  const parts = numericValue.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.join(",");
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
  const styles = useMemo(() => createStyles(theme), [theme]);

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
        savedMode === "split" ? initialItem.value * savedMonths : initialItem.value;

      setEditItem({
        ...initialItem,
        value: totalValue,
      });

      setCategoryType(savedType);
      setRepeatMode(savedMode);
      setInstallments(isNew ? "1" : String(savedMonths));
      setInputValue(totalValue > 0 ? formatCurrency(String(totalValue.toFixed(2))) : "");
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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isNew ? "Novo Item" : editItem.name}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.repeatSelector, { marginBottom: 15 }]}>
            <TouchableOpacity
              style={[
                styles.repeatTab,
                categoryType === "income" && { backgroundColor: theme.success },
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
                categoryType === "expense" && { backgroundColor: theme.error },
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
                categoryType === "investment" && { backgroundColor: theme.warning },
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
            value={editItem.name}
            onChangeText={(t) => setEditItem({ ...editItem, name: t })}
          />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 2 }}>
              <Text style={styles.label}>Valor Total (R$)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor={theme.secondary}
                value={inputValue}
                onChangeText={(t) => {
                  const formatted = formatCurrency(t);
                  setInputValue(formatted);
                  
                  const digits = formatted.replace(/\D/g, "");
                  const numericValue = digits ? parseInt(digits, 10) / 100 : 0;
                  
                  setEditItem({
                    ...editItem,
                    value: numericValue,
                  });
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Meses</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={installments}
                onChangeText={setInstallments}
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
                  editItem.icon === item.name && { borderColor: editItem.color || theme.primary },
                ]}
                onPress={() => setEditItem({ ...editItem, icon: item.name })}
              >
                <item.lib
                  color={editItem.icon === item.name ? (editItem.color || theme.primary) : theme.secondary}
                  size={22}
                />
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.name}
          />

          <ColorWheelPicker
            color={editItem.color || theme.primary}
            onColorChange={(hex) =>
              setEditItem((prev) => (prev ? { ...prev, color: hex } : prev))
            }
            theme={theme}
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
                {isNew ? "CONFIRMAR E SALVAR" : "ATUALIZAR"}
              </Text>
            )}
          </TouchableOpacity>

          {!isNew && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={isSaving}
            >
              <Trash2 color={theme.error} size={20} />
              <Text style={{ color: theme.error, fontWeight: "bold" }}>EXCLUIR</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
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
    label: { color: theme.secondary, fontSize: 11, marginBottom: 4 },
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
