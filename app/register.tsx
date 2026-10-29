import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState, useMemo } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  User as UserIcon,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sun,
  Moon,
  Sparkles,
  Check,
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

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const activeTheme = Colors[theme as keyof typeof Colors];
  const styles = useMemo(
    () => createStyles(activeTheme, isDark),
    [activeTheme, isDark],
  );

  const heroGradient: [string, string, string] = isDark
    ? ["#0E2F38", "#162229", activeTheme.card]
    : ["#E0F7FA", "#F4FCFD", activeTheme.card];

  const formGradient: [string, string] = isDark
    ? ["#1E262D", activeTheme.card]
    : ["#FFFFFF", "#F8FAFC"];

  const router = useRouter();
  const { showAlert } = useAlert();

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? -40 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <ArrowLeft size={20} color={activeTheme.text} />
          </TouchableOpacity>

          <View
            style={[
              styles.headerBadge,
              {
                backgroundColor: activeTheme.primary + (isDark ? "20" : "16"),
                borderColor: activeTheme.primary + "44",
              },
            ]}
          >
            <Sparkles size={13} color={activeTheme.primary} />
            <Text
              style={[styles.headerBadgeText, { color: activeTheme.primary }]}
            >
              NOVA CONTA
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={toggleTheme}
            activeOpacity={0.75}
          >
            {isDark ? (
              <Sun size={20} color={activeTheme.primary} />
            ) : (
              <Moon size={20} color={activeTheme.primary} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View
              style={[
                styles.heroCardWrapper,
                {
                  borderColor: activeTheme.primary + (isDark ? "55" : "44"),
                  shadowColor: activeTheme.primary,
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
                    styles.decorativeCircle,
                    {
                      backgroundColor:
                        activeTheme.primary + (isDark ? "14" : "18"),
                    },
                  ]}
                />

                <Text style={styles.title}>CRIAR CONTA</Text>
                <Text style={styles.subTitle}>
                  Configure seu perfil para iniciar sua organização financeira no Seiker.
                </Text>

                <TouchableOpacity
                  style={styles.avatarOuterRing}
                  onPress={pickImage}
                  activeOpacity={0.85}
                >
                  <View style={styles.avatarButton}>
                    {image ? (
                      <Image
                        source={{ uri: image }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <UserIcon
                          size={42}
                          color={activeTheme.primary}
                          strokeWidth={1.8}
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.cameraIconBadge}>
                    <Camera size={15} color={activeTheme.background} />
                  </View>
                </TouchableOpacity>
                <Text style={styles.avatarLabel}>
                  Toque para adicionar uma foto (opcional)
                </Text>
              </LinearGradient>
            </View>

            {/* Card de Formulário */}
            <View style={styles.formCardWrapper}>
              <LinearGradient
                colors={formGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.formCard}
              >
                <Text style={styles.inputLabel}>NOME COMPLETO</Text>
                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputIconBox,
                      { backgroundColor: activeTheme.primary + "1A" },
                    ]}
                  >
                    <UserIcon size={17} color={activeTheme.primary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Como prefere ser chamado?"
                    placeholderTextColor={activeTheme.secondary}
                    value={name}
                    onChangeText={setName}
                    editable={!loading}
                  />
                </View>

                <Text style={styles.inputLabel}>E-MAIL</Text>
                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputIconBox,
                      { backgroundColor: activeTheme.primary + "1A" },
                    ]}
                  >
                    <Mail size={17} color={activeTheme.primary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="seuemail@exemplo.com"
                    placeholderTextColor={activeTheme.secondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                  />
                </View>

                <Text style={styles.inputLabel}>SENHA</Text>
                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputIconBox,
                      { backgroundColor: activeTheme.primary + "1A" },
                    ]}
                  >
                    <Lock size={17} color={activeTheme.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { paddingRight: 42 }]}
                    placeholder="Mínimo de 6 caracteres"
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
                      <EyeOff size={19} color={activeTheme.secondary} />
                    ) : (
                      <Eye size={19} color={activeTheme.secondary} />
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>CONFIRMAR SENHA</Text>
                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputIconBox,
                      { backgroundColor: activeTheme.primary + "1A" },
                    ]}
                  >
                    <Lock size={17} color={activeTheme.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { paddingRight: 42 }]}
                    placeholder="Repita a senha escolhida"
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
                      <EyeOff size={19} color={activeTheme.secondary} />
                    ) : (
                      <Eye size={19} color={activeTheme.secondary} />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.mainButton,
                    loading && styles.mainButtonDisabled,
                  ]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator
                      color={activeTheme.background}
                      size="small"
                    />
                  ) : (
                    <>
                      <Check size={18} color={activeTheme.background} />
                      <Text style={styles.buttonText}>FINALIZAR CADASTRO</Text>
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Já tem uma conta?</Text>
              <TouchableOpacity
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}> Faça Login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (activeTheme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.background,
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
      backgroundColor: activeTheme.card,
      borderWidth: 1,
      borderColor: activeTheme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    headerBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
    },
    headerBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    heroCardWrapper: {
      borderRadius: 26,
      borderWidth: 1.5,
      backgroundColor: activeTheme.card,
      overflow: "hidden",
      marginBottom: 18,
      elevation: 6,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: isDark ? 0.3 : 0.12,
      shadowRadius: 12,
    },
    heroCard: {
      paddingVertical: 22,
      paddingHorizontal: 20,
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
    },
    decorativeCircle: {
      position: "absolute",
      width: 170,
      height: 170,
      borderRadius: 85,
      right: -50,
      top: -50,
    },
    title: {
      color: activeTheme.text,
      fontSize: 24,
      fontWeight: "900",
      textAlign: "center",
      letterSpacing: 1,
    },
    subTitle: {
      color: activeTheme.secondary,
      fontSize: 12,
      textAlign: "center",
      marginTop: 6,
      marginBottom: 18,
      lineHeight: 18,
      paddingHorizontal: 10,
    },
    avatarOuterRing: {
      padding: 4,
      borderRadius: 56,
      borderWidth: 2,
      borderColor: activeTheme.primary + "66",
      position: "relative",
    },
    avatarButton: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: activeTheme.card,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: activeTheme.primary,
      overflow: "hidden",
    },
    avatarImage: {
      width: "100%",
      height: "100%",
      borderRadius: 48,
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
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2.5,
      borderColor: activeTheme.card,
      elevation: 5,
    },
    avatarLabel: {
      color: activeTheme.secondary,
      fontSize: 11,
      marginTop: 10,
      fontWeight: "600",
    },
    formCardWrapper: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: activeTheme.border,
      backgroundColor: activeTheme.card,
      overflow: "hidden",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.25 : 0.06,
      shadowRadius: 10,
    },
    formCard: {
      padding: 20,
    },
    inputLabel: {
      color: activeTheme.secondary,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 6,
      marginLeft: 4,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: activeTheme.background,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: activeTheme.border,
      height: 52,
      paddingHorizontal: 12,
      marginBottom: 15,
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
      color: activeTheme.text,
      fontSize: 15,
      fontWeight: "600",
      height: "100%",
    },
    eyeIcon: {
      padding: 8,
      position: "absolute",
      right: 8,
    },
    mainButton: {
      flexDirection: "row",
      gap: 8,
      backgroundColor: activeTheme.primary,
      height: 54,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 6,
      shadowColor: activeTheme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 6,
    },
    mainButtonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: activeTheme.background,
      fontWeight: "900",
      fontSize: 14,
      letterSpacing: 1,
    },
    footer: {
      flexDirection: "row",
      marginTop: 22,
      justifyContent: "center",
      alignItems: "center",
      gap: 4,
    },
    footerText: {
      color: activeTheme.secondary,
      fontSize: 14,
      fontWeight: "500",
    },
    secondaryButtonText: {
      color: activeTheme.primary,
      fontSize: 14,
      fontWeight: "800",
    },
  });
