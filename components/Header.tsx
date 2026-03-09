import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
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
  TrendingDown,
  TrendingUp,
  Wallet,
  ShoppingBag,
  Coffee,
  Car,
  Home as HomeIcon,
  Heart,
} from "lucide-react-native";
import { auth, db } from "../FirebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Colors } from "../constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useMonth } from "@/context/MonthContext";
import { useRouter } from "expo-router";

export default function GlobalHeader() {
  const router = useRouter();
  const { theme: themeMode } = useTheme();
  const theme = Colors[themeMode as keyof typeof Colors];
  const { selectedMonthId, setSelectedMonthId } = useMonth();

  const [menuVisible, setMenuVisible] = useState(false);
  const [templateModal, setTemplateModal] = useState(false);
  const [templateCategories, setTemplateCategories] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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

  const changeMonth = (direction: number) => {
    const [y, m] = selectedMonthId.split("-").map(Number);
    const d = new Date(y, m - 1 + direction, 1);
    setSelectedMonthId(d.toISOString().slice(0, 7));
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
    await updateDoc(doc(db, "users", user.uid), {
      categoryTemplate: templateCategories,
    });
    setIsSaving(false);
    setTemplateModal(false);
    Alert.alert("Sucesso", "Template padrão atualizado!");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity onPress={() => setMenuVisible(true)}>
        <User color={theme.primary} size={28} />
      </TouchableOpacity>

      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <ChevronLeft color={theme.primary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: theme.text }]}>
          {new Date(selectedMonthId + "-01").toLocaleString("pt-BR", {
            month: "short",
            year: "numeric",
          })}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <ChevronRight color={theme.primary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={{ width: 28 }} />

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
              <Text style={{ color: theme.text }}>Criar Template</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
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
              data={templateCategories}
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
              onPress={() =>
                setTemplateCategories([
                  ...templateCategories,
                  {
                    id: Date.now().toString(),
                    name: "Nova Categoria",
                    value: 0,
                    color: "#FFF",
                    icon: "Target",
                  },
                ])
              }
            >
              <Plus color={theme.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={saveTemplate}
            >
              {isSaving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={{ fontWeight: "bold" }}>SALVAR TEMPLATE</Text>
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
  monthText: { fontSize: 16, fontWeight: "bold", textTransform: "capitalize" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    position: "absolute",
    top: 100,
    left: 20,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    width: 180,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  modalContent: {
    width: "85%",
    height: "70%",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  templateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    marginBottom: 8,
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
    padding: 15,
    borderRadius: 10,
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
