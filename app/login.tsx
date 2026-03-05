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
  useColorScheme,
} from "react-native";
import { auth } from "../FirebaseConfig";
import { Colors } from "../constants/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const colorScheme = useColorScheme() ?? "dark";
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);

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
      <Text style={styles.logoText}>SEIKER</Text>
      <Text style={styles.subTitle}>FINANCE</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.secondary}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={theme.secondary}
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

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: "center",
      padding: 30,
    },
    logoText: {
      color: theme.primary,
      fontSize: 42,
      fontWeight: "bold",
      textAlign: "center",
      letterSpacing: 5,
    },
    subTitle: {
      color: theme.text,
      fontSize: 18,
      textAlign: "center",
      marginBottom: 50,
      opacity: 0.7,
    },
    inputContainer: { marginBottom: 30 },
    input: {
      backgroundColor: theme.card,
      color: theme.text,
      padding: 20,
      borderRadius: 12,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: theme.border,
    },
    mainButton: {
      backgroundColor: theme.primary,
      padding: 20,
      borderRadius: 12,
      alignItems: "center",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
      elevation: 10,
    },
    buttonText: { color: theme.background, fontWeight: "bold", fontSize: 16 },
    secondaryButton: { marginTop: 20, alignItems: "center" },
    secondaryButtonText: { color: theme.primary, fontSize: 14 },
  });
