import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../FirebaseConfig";
import { Colors } from "../constants/theme";
import { useTheme } from "@/context/ThemeContext"; // 1. Importando o contexto
import { Sun, Moon } from "lucide-react-native"; // 2. Importando os ícones

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // 3. Trocando o useColorScheme pelo useTheme
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
      Alert.alert("Erro na Autenticação", error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* 4. Botão de trocar tema adicionado no topo */}
      <TouchableOpacity 
        onPress={toggleTheme} 
        style={styles.themeToggle}
      >
        {theme === 'dark' ? (
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
    </View>
  );
}

const createStyles = (activeTheme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.background,
      justifyContent: "center",
      padding: 30,
    },
    // Estilo do botão de tema
    themeToggle: {
      position: 'absolute',
      top: 60,
      right: 30,
      padding: 10,
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
    buttonText: { color: activeTheme.background, fontWeight: "bold", fontSize: 16 },
    secondaryButton: { marginTop: 20, alignItems: "center" },
    secondaryButtonText: { color: activeTheme.primary, fontSize: 14 },
  });