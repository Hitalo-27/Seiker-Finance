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
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  User as UserIcon,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from "lucide-react-native";
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    Keyboard.dismiss();

    if (!name || !email || !password || !confirmPassword) {
      showAlert({
        title: "Dados Incompletos",
        message: "Por favor, preencha todos os campos para prosseguir.",
        type: "error",
        onConfirm: () => {},
      });
      return;
    }

    if (password.length < 6) {
      showAlert({
        title: "Senha Fraca",
        message: "A senha deve conter pelo menos 6 caracteres.",
        type: "error",
        onConfirm: () => {},
      });
      return;
    }

    if (password !== confirmPassword) {
      showAlert({
        title: "Senhas Diferentes",
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
        title: "Bem-vindo!",
        message: "Sua conta foi criada com sucesso no Seiker Finance.",
        type: "success",
        onConfirm: () => router.replace("/home"),
      });
    } catch (error: any) {
      let errorMessage = "Ocorreu um erro ao criar sua conta. Tente novamente.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este e-mail já está em uso por outra conta.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "O formato do e-mail digitado é inválido.";
      }

      showAlert({
        title: "Falha no Cadastro",
        message: errorMessage,
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? -60 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={activeTheme.text} />
          </TouchableOpacity>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={styles.titleContainer}>
              <Text style={styles.title}>CRIAR CONTA</Text>
              <Text style={styles.subTitle}>
                Preencha os dados abaixo para iniciar sua organização financeira
                no Seiker.
              </Text>
            </View>

            <View style={styles.avatarContainer}>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                {image ? (
                  <Image source={{ uri: image }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <UserIcon
                      size={45}
                      color={activeTheme.secondary}
                      strokeWidth={1.5}
                    />
                  </View>
                )}
                <View style={styles.cameraIconBadge}>
                  <Camera size={18} color={activeTheme.background} />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarLabel}>Toque para adicionar foto</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <UserIcon
                  size={20}
                  color={activeTheme.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nome Completo"
                  placeholderTextColor={activeTheme.secondary}
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Mail
                  size={20}
                  color={activeTheme.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Seu melhor E-mail"
                  placeholderTextColor={activeTheme.secondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock
                  size={20}
                  color={activeTheme.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Senha (mín. 6 caracteres)"
                  placeholderTextColor={activeTheme.secondary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={activeTheme.secondary} />
                  ) : (
                    <Eye size={20} color={activeTheme.secondary} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Lock
                  size={20}
                  color={activeTheme.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar Senha"
                  placeholderTextColor={activeTheme.secondary}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={activeTheme.secondary} />
                  ) : (
                    <Eye size={20} color={activeTheme.secondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.mainButton, loading && styles.mainButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator
                  color={activeTheme.background}
                  size="small"
                />
              ) : (
                <Text style={styles.buttonText}>FINALIZAR CADASTRO</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Já tem uma conta?</Text>
              <TouchableOpacity
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>Faça Login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (activeTheme: any) =>
  StyleSheet.create({
    header: {
      height: 60,
      justifyContent: "center",
      paddingHorizontal: 10,
      marginTop: Platform.OS === "ios" ? 0 : 30,
    },
    backButton: {
      padding: 10,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    titleContainer: {
      marginBottom: 30,
      alignItems: "center",
    },
    title: {
      color: activeTheme.text,
      fontSize: 32,
      fontWeight: "bold",
      textAlign: "center",
      letterSpacing: 1,
    },
    subTitle: {
      color: activeTheme.text,
      fontSize: 15,
      textAlign: "center",
      marginTop: 10,
      opacity: 0.7,
      lineHeight: 22,
      paddingHorizontal: 10,
    },
    avatarContainer: {
      alignItems: "center",
      marginBottom: 35,
    },
    avatarButton: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: activeTheme.card,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: activeTheme.border,
      position: "relative",

      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    avatarImage: {
      width: 110,
      height: 110,
      borderRadius: 55,
    },
    avatarPlaceholder: {
      justifyContent: "center",
      alignItems: "center",
    },
    cameraIconBadge: {
      position: "absolute",
      bottom: 2,
      right: 2,
      backgroundColor: activeTheme.primary,
      padding: 10,
      borderRadius: 25,
      elevation: 5,
      shadowColor: activeTheme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    avatarLabel: {
      color: activeTheme.secondary,
      fontSize: 13,
      marginTop: 12,
      fontWeight: "500",
    },
    formContainer: {
      marginBottom: 25,
      gap: 16,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: activeTheme.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: activeTheme.border,
      height: 60,
      paddingHorizontal: 18,
    },
    inputIcon: {
      marginRight: 14,
    },
    input: {
      flex: 1,
      color: activeTheme.text,
      fontSize: 16,
      height: "100%",
    },
    eyeIcon: {
      padding: 10,
    },
    mainButton: {
      backgroundColor: activeTheme.primary,
      height: 60,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,

      shadowColor: activeTheme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
    },
    mainButtonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: activeTheme.background,
      fontWeight: "bold",
      fontSize: 16,
      letterSpacing: 1,
    },
    footer: {
      flexDirection: "row",
      marginTop: 30,
      justifyContent: "center",
      alignItems: "center",
      gap: 5,
    },
    footerText: {
      color: activeTheme.text,
      fontSize: 15,
      opacity: 0.8,
    },
    secondaryButtonText: {
      color: activeTheme.primary,
      fontSize: 15,
      fontWeight: "bold",
    },
  });
