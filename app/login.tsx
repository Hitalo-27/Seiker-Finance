import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useState, useEffect } from "react";
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
  const activeTheme = Colors[theme as keyof typeof Colors];
  const styles = createStyles(activeTheme);

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
    <View style={{ flex: 1, backgroundColor: activeTheme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? -60 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
              {theme === "dark" ? (
                <Sun color={activeTheme.primary} size={26} />
              ) : (
                <Moon color={activeTheme.text} size={26} />
              )}
            </TouchableOpacity>

            <View style={styles.headerContainer}>
              <Text style={styles.logoText}>SEIKER</Text>
              <Text style={styles.subTitle}>FINANCE</Text>
              <Text style={styles.welcomeText}>Bem-vindo de volta!</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <Mail
                  color={activeTheme.secondary}
                  size={20}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor={activeTheme.secondary}
                  onChangeText={setEmail}
                  value={email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock
                  color={activeTheme.secondary}
                  size={20}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { paddingRight: 50 }]}
                  placeholder="Senha"
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
                    <EyeOff color={activeTheme.secondary} size={20} />
                  ) : (
                    <Eye color={activeTheme.secondary} size={20} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
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
                <Text style={styles.buttonText}>ACESSAR SISTEMA</Text>
              )}
            </TouchableOpacity>

            {isBiometricSupported && (
              <View style={styles.biometricContainer}>
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OU</Text>
                  <View style={styles.divider} />
                </View>

                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricAuth}
                  disabled={isLoading}
                >
                  <View style={styles.biometricIconWrapper}>
                    <Fingerprint color={activeTheme.primary} size={36} />
                  </View>
                  <Text style={styles.biometricText}>
                    Acessar com a Digital
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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
    </View>
  );
}

const createStyles = (activeTheme: any) =>
  StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
    },
    themeToggle: {
      position: "absolute",
      top: 50,
      right: 20,
      padding: 10,
      zIndex: 10,
    },
    headerContainer: {
      alignItems: "center",
      marginBottom: 40,
      marginTop: 20,
    },
    logoText: {
      color: activeTheme.primary,
      fontSize: 42,
      fontWeight: "900",
      letterSpacing: 4,
    },
    subTitle: {
      color: activeTheme.text,
      fontSize: 16,
      letterSpacing: 8,
      opacity: 0.7,
      marginBottom: 16,
    },
    welcomeText: {
      color: activeTheme.text,
      fontSize: 16,
      fontWeight: "500",
      opacity: 0.9,
    },
    formContainer: {
      marginBottom: 20,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: activeTheme.card,
      borderWidth: 1,
      borderColor: activeTheme.border,
      borderRadius: 14,
      marginBottom: 16,
      paddingHorizontal: 16,
      height: 60,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      color: activeTheme.text,
      fontSize: 16,
      height: "100%",
    },
    eyeIcon: {
      padding: 10,
      position: "absolute",
      right: 10,
    },
    mainButton: {
      backgroundColor: activeTheme.primary,
      height: 60,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
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
      fontWeight: "bold",
      fontSize: 16,
      letterSpacing: 1,
    },
    biometricContainer: {
      marginTop: 30,
      alignItems: "center",
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      marginBottom: 20,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: activeTheme.border,
    },
    dividerText: {
      color: activeTheme.secondary,
      paddingHorizontal: 15,
      fontSize: 14,
      fontWeight: "500",
    },
    biometricButton: {
      alignItems: "center",
      justifyContent: "center",
      padding: 10,
    },
    biometricIconWrapper: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: activeTheme.card,
      borderWidth: 1,
      borderColor: activeTheme.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    biometricText: {
      color: activeTheme.text,
      fontSize: 14,
      fontWeight: "500",
    },
    footerContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 40,
    },
    footerText: {
      color: activeTheme.text,
      opacity: 0.7,
      fontSize: 15,
    },
    secondaryButtonText: {
      color: activeTheme.primary,
      fontSize: 15,
      fontWeight: "bold",
    },
  });
