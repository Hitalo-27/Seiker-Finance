import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { auth } from "../FirebaseConfig";
import { Colors } from "../constants/theme";
import { useTheme } from "@/context/ThemeContext";
import {
  Sun,
  Moon,
  Fingerprint,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Wallet,
  ArrowRight,
  ShieldCheck,
} from "lucide-react-native";
import { useAlert } from "@/context/AlertContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { showAlert } = useAlert();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const activeTheme = Colors[theme as keyof typeof Colors];
  const styles = useMemo(
    () => createStyles(activeTheme, isDark),
    [activeTheme, isDark],
  );

  const cardGradient: [string, string, string] = isDark
    ? ["#0E2F38", "#162229", activeTheme.card]
    : ["#E0F7FA", "#F4FCFD", activeTheme.card];

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
    })();
  }, []);

  const saveCredentials = async (email: string, pass: string) => {
    await SecureStore.setItemAsync("user_email", email);
    await SecureStore.setItemAsync("user_password", pass);
  };

  const handleAuth = async (type: "login" | "register") => {
    if (!email || !password) {
      showAlert({
        title: "Atenção",
        message: "Preencha todos os campos.",
        type: "error",
        onConfirm: () => {},
      });
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      if (type === "login") {
        await signInWithEmailAndPassword(auth, email, password);

        const hasSaved = await SecureStore.getItemAsync("user_email");
        if (!hasSaved && isBiometricSupported) {
          setIsLoading(false);
          showAlert({
            title: "Biometria",
            message:
              "Deseja ativar o login por digital para os próximos acessos?",
            type: "info",
            onConfirm: () => {
              saveCredentials(email, password);
              router.replace("/home");
            },
          });
          return;
        }
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.replace("/home");
    } catch (error: any) {
      showAlert({
        title: "Erro na Autenticação",
        message: "E-mail ou senha inválidos. Tente novamente.",
        type: "error",
        onConfirm: () => {},
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    const savedEmail = await SecureStore.getItemAsync("user_email");
    const savedPass = await SecureStore.getItemAsync("user_password");

    if (!savedEmail || !savedPass) {
      showAlert({
        title: "Ops!",
        message:
          "Nenhuma biometria cadastrada. Faça login manualmente primeiro.",
        type: "error",
        onConfirm: () => {},
      });
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Acesse o Seiker Finance",
      fallbackLabel: "Usar senha",
    });

    if (result.success) {
      setIsLoading(true);
      try {
        await signInWithEmailAndPassword(auth, savedEmail, savedPass);
        router.replace("/home");
      } catch (e) {
        showAlert({
          title: "Erro",
          message: "Falha ao autenticar com dados salvos.",
          type: "error",
          onConfirm: () => {},
        });
        setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.ambientGlowTop,
          { backgroundColor: activeTheme.primary + (isDark ? "14" : "18") },
        ]}
      />
      <View
        style={[
          styles.ambientGlowBottom,
          { backgroundColor: activeTheme.primary + (isDark ? "0D" : "12") },
        ]}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? -40 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.topBar}>
              <View
                style={[
                  styles.securityBadge,
                  {
                    backgroundColor:
                      activeTheme.primary + (isDark ? "18" : "14"),
                    borderColor: activeTheme.primary + "40",
                  },
                ]}
              >
                <ShieldCheck size={14} color={activeTheme.primary} />
                <Text
                  style={[
                    styles.securityBadgeText,
                    { color: activeTheme.primary },
                  ]}
                >
                  AMBIENTE SEGURO
                </Text>
              </View>

              <TouchableOpacity
                onPress={toggleTheme}
                style={styles.themeToggle}
                activeOpacity={0.75}
              >
                {isDark ? (
                  <Sun color={activeTheme.primary} size={20} />
                ) : (
                  <Moon color={activeTheme.primary} size={20} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.headerContainer}>
              <View
                style={[
                  styles.brandIconOuter,
                  {
                    borderColor: activeTheme.primary + "55",
                    backgroundColor:
                      activeTheme.primary + (isDark ? "1F" : "15"),
                  },
                ]}
              >
                <Wallet size={30} color={activeTheme.primary} />
              </View>
              <Text style={styles.logoText}>SEIKER</Text>
              <View style={styles.financePill}>
                <Text style={styles.subTitle}>FINANCE</Text>
              </View>
              <Text style={styles.welcomeText}>
                Bem-vindo de volta! Acesse sua conta para continuar.
              </Text>
            </View>

            <View
              style={[
                styles.cardWrapper,
                {
                  borderColor: activeTheme.primary + (isDark ? "55" : "44"),
                  shadowColor: activeTheme.primary,
                },
              ]}
            >
              <LinearGradient
                colors={cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardInner}
              >
                <View
                  style={[
                    styles.cardCornerCircle,
                    {
                      backgroundColor:
                        activeTheme.primary + (isDark ? "12" : "15"),
                    },
                  ]}
                />

                <Text style={styles.inputLabel}>E-MAIL</Text>
                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputIconBox,
                      { backgroundColor: activeTheme.primary + "1A" },
                    ]}
                  >
                    <Mail color={activeTheme.primary} size={18} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="seuemail@exemplo.com"
                    placeholderTextColor={activeTheme.secondary}
                    onChangeText={setEmail}
                    value={email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading}
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
                    <Lock color={activeTheme.primary} size={18} />
                  </View>
                  <TextInput
                    style={[styles.input, { paddingRight: 44 }]}
                    placeholder="Digite sua senha"
                    placeholderTextColor={activeTheme.secondary}
                    secureTextEntry={!showPassword}
                    onChangeText={setPassword}
                    value={password}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff color={activeTheme.secondary} size={19} />
                    ) : (
                      <Eye color={activeTheme.secondary} size={19} />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.mainButton,
                    isLoading && styles.mainButtonDisabled,
                  ]}
                  onPress={() => handleAuth("login")}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator
                      color={activeTheme.background}
                      size="small"
                    />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>ACESSAR SISTEMA</Text>
                      <ArrowRight size={18} color={activeTheme.background} />
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {isBiometricSupported && (
              <View style={styles.biometricContainer}>
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OU ACESSO RÁPIDO</Text>
                  <View style={styles.divider} />
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.biometricCard,
                    {
                      borderColor: activeTheme.primary + "44",
                    },
                  ]}
                  onPress={handleBiometricAuth}
                  disabled={isLoading}
                >
                  <View
                    style={[
                      styles.biometricIconWrapper,
                      { backgroundColor: activeTheme.primary + "1F" },
                    ]}
                  >
                    <Fingerprint color={activeTheme.primary} size={26} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.biometricTitle}>
                      Entrar com a Digital
                    </Text>
                    <Text style={styles.biometricSubtitle}>
                      Toque para autenticar via biometria
                    </Text>
                  </View>
                  <ArrowRight size={16} color={activeTheme.primary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Rodapé */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Não tem uma conta?</Text>
              <TouchableOpacity
                onPress={() => router.push("/register")}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}> Criar conta</Text>
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
      position: "relative",
    },
    ambientGlowTop: {
      position: "absolute",
      width: 260,
      height: 260,
      borderRadius: 130,
      top: -90,
      right: -80,
    },
    ambientGlowBottom: {
      position: "absolute",
      width: 220,
      height: 220,
      borderRadius: 110,
      bottom: -70,
      left: -70,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 22,
      paddingVertical: 16,
    },
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
    },
    securityBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
    },
    securityBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
    },
    themeToggle: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: activeTheme.card,
      borderWidth: 1,
      borderColor: activeTheme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    headerContainer: {
      alignItems: "center",
      marginBottom: 26,
    },
    brandIconOuter: {
      width: 64,
      height: 64,
      borderRadius: 20,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    logoText: {
      color: activeTheme.primary,
      fontSize: 38,
      fontWeight: "900",
      letterSpacing: 4,
    },
    financePill: {
      paddingHorizontal: 12,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.05)"
        : "rgba(0,0,0,0.04)",
      marginTop: 2,
      marginBottom: 12,
    },
    subTitle: {
      color: activeTheme.text,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 5,
      opacity: 0.75,
    },
    welcomeText: {
      color: activeTheme.secondary,
      fontSize: 13,
      fontWeight: "500",
      textAlign: "center",
    },
    cardWrapper: {
      borderRadius: 26,
      borderWidth: 1.5,
      backgroundColor: activeTheme.card,
      overflow: "hidden",
      elevation: 8,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.14,
      shadowRadius: 14,
    },
    cardInner: {
      padding: 22,
      position: "relative",
      overflow: "hidden",
    },
    cardCornerCircle: {
      position: "absolute",
      width: 160,
      height: 160,
      borderRadius: 80,
      right: -50,
      top: -50,
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
      borderWidth: 1,
      borderColor: activeTheme.border,
      borderRadius: 15,
      marginBottom: 16,
      paddingHorizontal: 12,
      height: 54,
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
      justifyContent: "center",
      alignItems: "center",
      marginTop: 6,
      shadowColor: activeTheme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    mainButtonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: activeTheme.background,
      fontWeight: "900",
      fontSize: 14,
      letterSpacing: 1,
    },
    biometricContainer: {
      marginTop: 22,
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      marginBottom: 14,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: activeTheme.border,
    },
    dividerText: {
      color: activeTheme.secondary,
      paddingHorizontal: 12,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
    },
    biometricCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: activeTheme.card,
      borderRadius: 18,
      borderWidth: 1,
      padding: 14,
    },
    biometricIconWrapper: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    biometricTitle: {
      color: activeTheme.text,
      fontSize: 14,
      fontWeight: "800",
    },
    biometricSubtitle: {
      color: activeTheme.secondary,
      fontSize: 11,
      marginTop: 2,
    },
    footerContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 26,
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
