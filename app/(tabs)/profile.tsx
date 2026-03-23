import React, { useState, useEffect } from "react";
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
import { ChevronLeft, Camera, Save, LogOut, Mail, User } from "lucide-react-native";
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
  const { theme: themeMode } = useTheme();
  const theme = Colors[themeMode as keyof typeof Colors];
  const { showAlert } = useAlert();

  const user = auth.currentUser;

  const [name, setName] = useState(user?.displayName || "");
  const [image, setImage] = useState<string | null>(user?.photoURL || null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const styles = createStyles(theme);

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      showAlert({ title: "ERRO", message: "O nome não pode estar vazio.", type: "error" });
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
      <View style={[styles.container, { justifyContent: 'center' }]}>
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color={theme.text} size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={50} color={theme.secondary} />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Camera size={20} color={theme.background} />
              </View>
            </TouchableOpacity>
            <Text style={styles.userNameText}>{user?.displayName || "Usuário"}</Text>
            <Text style={styles.userEmailText}>{user?.email}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.inputLabel}>Nome Completo</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color={theme.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Seu nome"
                placeholderTextColor={theme.secondary}
              />
            </View>

            <Text style={styles.inputLabel}>E-mail (Não editável)</Text>
            <View style={[styles.inputWrapper, { opacity: 0.6 }]}>
              <Mail size={20} color={theme.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={user?.email || ""}
                editable={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <>
                  <Save size={20} color={theme.background} />
                  <Text style={styles.saveButtonText}>SALVAR ALTERAÇÕES</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color={theme.error} />
              <Text style={styles.logoutButtonText}>Sair da Conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
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
      paddingVertical: 15,
    },
    backButton: {
      padding: 5,
    },
    headerTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "bold",
    },
    scrollContent: {
      paddingBottom: 40,
    },
    avatarSection: {
      alignItems: "center",
      marginTop: 20,
      marginBottom: 30,
    },
    avatarWrapper: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.card,
      borderWidth: 3,
      borderColor: theme.primary,
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: 60,
    },
    avatarPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    cameraBadge: {
      position: "absolute",
      bottom: 5,
      right: 5,
      backgroundColor: theme.primary,
      padding: 8,
      borderRadius: 20,
      elevation: 4,
    },
    userNameText: {
      color: theme.text,
      fontSize: 22,
      fontWeight: "bold",
      marginTop: 15,
    },
    userEmailText: {
      color: theme.secondary,
      fontSize: 14,
      marginTop: 5,
    },
    form: {
      paddingHorizontal: 25,
    },
    inputLabel: {
      color: theme.secondary,
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: 8,
      marginLeft: 5,
      textTransform: "uppercase",
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 20,
      paddingHorizontal: 15,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      color: theme.text,
      paddingVertical: 15,
      fontSize: 16,
    },
    saveButton: {
      flexDirection: "row",
      backgroundColor: theme.primary,
      padding: 18,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginTop: 10,
      elevation: 4,
    },
    saveButtonText: {
      color: theme.background,
      fontWeight: "bold",
      fontSize: 16,
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginTop: 30,
      padding: 15,
    },
    logoutButtonText: {
      color: theme.error,
      fontWeight: "bold",
      fontSize: 15,
    },
  });