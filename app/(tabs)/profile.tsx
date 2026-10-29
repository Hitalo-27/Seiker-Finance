import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Camera,
  Save,
  LogOut,
  Mail,
  User,
  ShieldCheck,
  Lock,
  Sun,
  Moon,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../FirebaseConfig";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../../constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useAlert } from "@/context/AlertContext";

export default function Profile() {
  const router = useRouter();
  const { theme: themeMode, toggleTheme } = useTheme();
  const isDark = themeMode === "dark";
  const theme = Colors[themeMode as keyof typeof Colors];
  const { showAlert } = useAlert();

  const user = auth.currentUser;

  const [name, setName] = useState(user?.displayName || "");
  const [image, setImage] = useState<string | null>(user?.photoURL || null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const heroGradient: [string, string, string] = isDark
    ? ["#0E2F38", "#16232A", theme.card]
    : ["#E0F7FA", "#F3FCFD", theme.card];

  const cardGradient: [string, string] = isDark
    ? ["#1E262D", theme.card]
    : ["#FFFFFF", "#F8FAFC"];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setName(data.name || user.displayName || "");
        setImage(data.profileImage || user.photoURL || null);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setFetching(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      showAlert({
        title: "ERRO",
        message: "O nome não pode estar vazio.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      await updateProfile(user, {
        displayName: name,
        photoURL: image,
      });

      await updateDoc(doc(db, "users", user.uid), {
        name: name,
        profileImage: image,
        updatedAt: new Date().toISOString(),
      });

      showAlert({
        title: "SUCESSO",
        message: "Perfil atualizado com sucesso!",
        type: "success",
        onConfirm: () => router.back(),
      });
    } catch (error: any) {
      showAlert({ title: "FALHA", message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    router.replace("/login");
  };

  if (fetching) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerIconBtn}
            activeOpacity={0.75}
          >
            <ChevronLeft color={theme.text} size={22} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Meu Perfil</Text>

          <TouchableOpacity
            onPress={toggleTheme}
            style={styles.headerIconBtn}
            activeOpacity={0.75}
          >
            {isDark ? (
              <Sun color={theme.primary} size={20} />
            ) : (
              <Moon color={theme.primary} size={20} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.heroCardWrapper,
              {
                borderColor: theme.primary + (isDark ? "55" : "44"),
                shadowColor: theme.primary,
              },
            ]}
          >
            <LinearGradient
              colors={heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View
                style={[
                  styles.decorativeCircleLarge,
                  { backgroundColor: theme.primary + (isDark ? "14" : "18") },
                ]}
              />
              <View
                style={[
                  styles.decorativeCircleSmall,
                  { backgroundColor: theme.primary + (isDark ? "0D" : "12") },
                ]}
              />

              <View
                style={[
                  styles.memberBadge,
                  {
                    backgroundColor: theme.primary + (isDark ? "20" : "18"),
                    borderColor: theme.primary + "44",
                  },
                ]}
              >
                <ShieldCheck size={13} color={theme.primary} />
                <Text
                  style={[styles.memberBadgeText, { color: theme.primary }]}
                >
                  CONTA SEIKER
                </Text>
              </View>

              <TouchableOpacity
                style={styles.avatarOuterRing}
                activeOpacity={0.85}
                onPress={pickImage}
              >
                <View style={styles.avatarWrapper}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <User size={46} color={theme.primary} />
                    </View>
                  )}
                </View>
                <View style={styles.cameraBadge}>
                  <Camera size={16} color={theme.background} />
                </View>
              </TouchableOpacity>

              <Text style={styles.photoHintText}>
                Toque na foto para alterar
              </Text>

              <Text style={styles.userNameText} numberOfLines={1}>
                {name || user?.displayName || "Usuário"}
              </Text>

              {user?.email ? (
                <View style={styles.emailPill}>
                  <Mail size={12} color={theme.secondary} />
                  <Text style={styles.userEmailText}>{user.email}</Text>
                </View>
              ) : null}
            </LinearGradient>
          </View>

          <View style={styles.formCardWrapper}>
            <LinearGradient
              colors={cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.formCard}
            >
              <View style={styles.sectionHeader}>
                <View
                  style={[
                    styles.sectionIconBadge,
                    {
                      backgroundColor: theme.primary + (isDark ? "24" : "18"),
                      borderColor: theme.primary + "44",
                    },
                  ]}
                >
                  <User size={17} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Dados Pessoais</Text>
                  <Text style={styles.sectionSubtitle}>
                    Gerencie como seu perfil aparece no aplicativo
                  </Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>Nome Completo</Text>
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.inputIconBox,
                    { backgroundColor: theme.primary + "18" },
                  ]}
                >
                  <User size={17} color={theme.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome"
                  placeholderTextColor={theme.secondary}
                />
              </View>

              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { marginBottom: 0 }]}>
                  E-mail da Conta
                </Text>
                <View style={styles.lockedBadge}>
                  <Lock size={10} color={theme.secondary} />
                  <Text style={styles.lockedBadgeText}>Não editável</Text>
                </View>
              </View>

              <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
                <View
                  style={[
                    styles.inputIconBox,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.05)",
                    },
                  ]}
                >
                  <Mail size={17} color={theme.secondary} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.secondary }]}
                  value={user?.email || ""}
                  editable={false}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.saveButton, loading && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <>
                    <Save size={19} color={theme.background} />
                    <Text style={styles.saveButtonText}>SALVAR ALTERAÇÕES</Text>
                  </>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.logoutCard,
              {
                borderColor: theme.error + "44",
                backgroundColor: isDark
                  ? "rgba(255, 82, 82, 0.08)"
                  : "rgba(229, 57, 53, 0.06)",
              },
            ]}
            onPress={handleLogout}
          >
            <View
              style={[
                styles.logoutIconBox,
                { backgroundColor: theme.error + "20" },
              ]}
            >
              <LogOut size={18} color={theme.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.logoutTitle}>Sair da Conta</Text>
              <Text style={styles.logoutSubtitle}>
                Encerrar sua sessão atual neste dispositivo
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    headerIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.2,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 50,
    },
    heroCardWrapper: {
      borderRadius: 26,
      borderWidth: 1.5,
      marginBottom: 20,
      overflow: "hidden",
      backgroundColor: theme.card,
      elevation: 6,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: isDark ? 0.3 : 0.14,
      shadowRadius: 12,
    },
    heroCard: {
      paddingVertical: 24,
      paddingHorizontal: 20,
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
    },
    decorativeCircleLarge: {
      position: "absolute",
      width: 190,
      height: 190,
      borderRadius: 95,
      right: -55,
      top: -55,
    },
    decorativeCircleSmall: {
      position: "absolute",
      width: 130,
      height: 130,
      borderRadius: 65,
      left: -40,
      bottom: -40,
    },
    memberBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 16,
    },
    memberBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
    },
    avatarOuterRing: {
      padding: 4,
      borderRadius: 64,
      borderWidth: 2,
      borderColor: theme.primary + "66",
      position: "relative",
    },
    avatarWrapper: {
      width: 108,
      height: 108,
      borderRadius: 54,
      backgroundColor: theme.card,
      borderWidth: 2,
      borderColor: theme.primary,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: 54,
    },
    avatarPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    cameraBadge: {
      position: "absolute",
      bottom: 2,
      right: 2,
      backgroundColor: theme.primary,
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2.5,
      borderColor: theme.card,
      elevation: 4,
    },
    photoHintText: {
      color: theme.secondary,
      fontSize: 11,
      marginTop: 8,
      opacity: 0.85,
    },
    userNameText: {
      color: theme.text,
      fontSize: 22,
      fontWeight: "800",
      marginTop: 10,
      letterSpacing: -0.3,
    },
    emailPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: isDark
        ? "rgba(0, 0, 0, 0.25)"
        : "rgba(255, 255, 255, 0.7)",
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(255, 255, 255, 0.07)"
        : "rgba(0, 0, 0, 0.06)",
    },
    userEmailText: {
      color: theme.secondary,
      fontSize: 12,
      fontWeight: "600",
    },
    formCardWrapper: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
      backgroundColor: theme.card,
      marginBottom: 18,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.25 : 0.06,
      shadowRadius: 10,
    },
    formCard: {
      padding: 20,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 20,
    },
    sectionIconBadge: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
    },
    sectionSubtitle: {
      color: theme.secondary,
      fontSize: 11,
      marginTop: 2,
    },
    labelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    inputLabel: {
      color: theme.secondary,
      fontSize: 11,
      fontWeight: "700",
      marginBottom: 8,
      marginLeft: 4,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    lockedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(0, 0, 0, 0.04)",
    },
    lockedBadgeText: {
      color: theme.secondary,
      fontSize: 10,
      fontWeight: "600",
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 18,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    inputWrapperDisabled: {
      opacity: 0.7,
    },
    inputIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    input: {
      flex: 1,
      color: theme.text,
      paddingVertical: 12,
      fontSize: 15,
      fontWeight: "600",
    },
    saveButton: {
      flexDirection: "row",
      backgroundColor: theme.primary,
      paddingVertical: 16,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginTop: 6,
      elevation: 4,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    saveButtonText: {
      color: theme.background,
      fontWeight: "800",
      fontSize: 14,
      letterSpacing: 0.6,
    },
    logoutCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
    },
    logoutIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    logoutTitle: {
      color: theme.error,
      fontWeight: "800",
      fontSize: 15,
    },
    logoutSubtitle: {
      color: theme.secondary,
      fontSize: 11,
      marginTop: 2,
    },
  });
