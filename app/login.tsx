import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useState } from "react";
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
} from "react-native";
import { auth } from "../FirebaseConfig";
import { Colors } from "../constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react-native";
import { useAlert } from "@/context/AlertContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { showAlert } = useAlert();

  const { theme, toggleTheme } = useTheme();
  const activeTheme = Colors[theme as keyof typeof Colors];
  const styles = createStyles(activeTheme);

  const handleAuth = async (type: "login" | "register") => {
    try {
      if (type === "login") {
        await signInWithEmailAndPassword(auth, email, password);
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
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
              {theme === "dark" ? (
                <Sun color={activeTheme.primary} size={28} />
              ) : (
                <Moon color={activeTheme.primary} size={28} />
              )}
            </TouchableOpacity>

            <Text style={styles.logoText}>SEIKER</Text>
            <Text style={styles.subTitle}>FINANCE</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={activeTheme.secondary}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor={activeTheme.secondary}
                secureTextEntry
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.mainButton}
              onPress={() => handleAuth("login")}
            >
              <Text style={styles.buttonText}>ACESSAR SISTEMA</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/register")}
            >
              <Text style={styles.secondaryButtonText}>CRIAR CONTA NOVA</Text>
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
    themeToggle: {
      position: "absolute",
      top: 60,
      right: 30,
      padding: 10,
      zIndex: 10,
    },
    logoText: {
      color: activeTheme.primary,
      fontSize: 42,
      fontWeight: "bold",
      textAlign: "center",
      letterSpacing: 5,
    },
    subTitle: {
      color: activeTheme.text,
      fontSize: 18,
      textAlign: "center",
      marginBottom: 50,
      opacity: 0.7,
    },
    inputContainer: { marginBottom: 30 },
    input: {
      backgroundColor: activeTheme.card,
      color: activeTheme.text,
      padding: 20,
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
      shadowColor: activeTheme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
      elevation: 10,
    },
    buttonText: {
      color: activeTheme.background,
      fontWeight: "bold",
      fontSize: 16,
    },
    secondaryButton: {
      marginTop: 20,
      alignItems: "center",
    },
    secondaryButtonText: {
      color: activeTheme.primary,
      fontSize: 14,
    },
  });
