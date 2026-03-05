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
  useColorScheme,
} from "react-native";
import { Colors } from "../constants/theme";
import { auth, db } from "../FirebaseConfig";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const colorScheme = useColorScheme() ?? "dark";
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);

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
        balance: 0,
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>NOVA CONTA</Text>
      <Text style={styles.subTitle}>
        Inicie sua organização financeira no Seiker
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nome Completo"
          placeholderTextColor={theme.secondary}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Seu melhor Email"
          placeholderTextColor={theme.secondary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={theme.secondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar Senha"
          placeholderTextColor={theme.secondary}
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
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: theme.background,
      justifyContent: "center",
      padding: 30,
    },
    title: {
      color: theme.primary,
      fontSize: 32,
      fontWeight: "bold",
      textAlign: "center",
      letterSpacing: 2,
    },
    subTitle: {
      color: theme.text,
      fontSize: 14,
      textAlign: "center",
      marginBottom: 40,
      opacity: 0.6,
    },
    inputContainer: { marginBottom: 20 },
    input: {
      backgroundColor: theme.card,
      color: theme.text,
      padding: 18,
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
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 8,
    },
    buttonText: { color: theme.background, fontWeight: "bold", fontSize: 16 },
    secondaryButton: { marginTop: 25, alignItems: "center" },
    secondaryButtonText: { color: theme.secondary, fontSize: 14 },
  });
