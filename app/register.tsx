import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, User as UserIcon } from "lucide-react-native";
import { Colors } from "../constants/theme";
import { auth, db } from "../FirebaseConfig";
import { useTheme } from "@/context/ThemeContext";
import { useAlert } from "@/context/AlertContext";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { theme } = useTheme();
  const activeTheme = Colors[theme as keyof typeof Colors];
  const styles = createStyles(activeTheme);

  const router = useRouter();
  const { showAlert } = useAlert();

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

  const handleRegister = async () => {
    if (!name || !email || !password) {
      showAlert({
        title: "DADOS INCOMPLETOS",
        message: "Preencha todos os campos para prosseguir.",
        type: "error",
        onConfirm: () => {},
      });
      return;
    }

    if (password !== confirmPassword) {
      showAlert({
        title: "SENHAS DIFERENTES",
        message: "As senhas digitadas não coincidem.",
        type: "error",
        onConfirm: () => {},
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
        photoURL: image,
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        profileImage: image,
        createdAt: new Date().toISOString(),
      });

      showAlert({
        title: "BEM-VINDO!",
        message: "Sua conta foi criada com sucesso no Seiker.",
        type: "success",
        onConfirm: () => router.replace("/home"),
      });
    } catch (error: any) {
      showAlert({
        title: "FALHA NO CADASTRO",
        message: error.message,
        type: "error",
        onConfirm: () => {},
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: activeTheme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "android" ? -60 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>NOVA CONTA</Text>
            <Text style={styles.subTitle}>
              Inicie sua organização financeira no Seiker
            </Text>

            <View style={styles.avatarContainer}>
              <TouchableOpacity style={styles.avatarButton} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <UserIcon size={40} color={activeTheme.secondary} />
                  </View>
                )}
                <View style={styles.cameraIconBadge}>
                  <Camera size={16} color={activeTheme.background} />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarLabel}>Foto de Perfil</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nome Completo"
                placeholderTextColor={activeTheme.secondary}
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Seu melhor Email"
                placeholderTextColor={activeTheme.secondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor={activeTheme.secondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmar Senha"
                placeholderTextColor={activeTheme.secondary}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.mainButton, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "PROCESSANDO..." : "FINALIZAR CADASTRO"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.secondaryButtonText}>
                Já tenho conta? Voltar ao Login
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (activeTheme: any) =>
  StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 30,
    },
    title: {
      color: activeTheme.primary,
      fontSize: 32,
      fontWeight: "bold",
      textAlign: "center",
      letterSpacing: 2,
    },
    subTitle: {
      color: activeTheme.text,
      fontSize: 14,
      textAlign: "center",
      marginBottom: 30,
      opacity: 0.6,
    },
    avatarContainer: {
      alignItems: "center",
      marginBottom: 30,
    },
    avatarButton: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: activeTheme.card,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: activeTheme.primary,
      position: "relative",
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarPlaceholder: {
      justifyContent: "center",
      alignItems: "center",
    },
    cameraIconBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: activeTheme.primary,
      padding: 8,
      borderRadius: 20,
    },
    avatarLabel: {
      color: activeTheme.secondary,
      fontSize: 12,
      marginTop: 8,
      fontWeight: "500",
    },
    inputContainer: { marginBottom: 20 },
    input: {
      backgroundColor: activeTheme.card,
      color: activeTheme.text,
      padding: 18,
      borderRadius: 12,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: activeTheme.border,
    },
    mainButton: {
      backgroundColor: activeTheme.primary,
      padding: 20,
      borderRadius: 12,
      alignItems: "center",
      elevation: 8,
    },
    buttonText: {
      color: activeTheme.background,
      fontWeight: "bold",
      fontSize: 16,
    },
    secondaryButton: {
      marginTop: 25,
      alignItems: "center",
    },
    secondaryButtonText: {
      color: activeTheme.secondary,
      fontSize: 14,
    },
  });
