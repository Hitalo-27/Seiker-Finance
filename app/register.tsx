import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
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
} from "react-native";
import { Colors } from "../constants/theme";
import { auth, db } from "../FirebaseConfig";
import { useTheme } from "@/context/ThemeContext";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { theme } = useTheme();
  const activeTheme = Colors[theme as keyof typeof Colors];
  const styles = createStyles(activeTheme);

  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
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

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Sucesso", "Conta criada com sucesso!");
      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Erro ao cadastrar", error.message);
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
    themeToggle: {
      position: "absolute",
      top: 60,
      right: 30,
      padding: 10,
      zIndex: 10,
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
      marginBottom: 40,
      opacity: 0.6,
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
      shadowColor: activeTheme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
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
