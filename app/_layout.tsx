import React from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// 1. Importe o nosso novo provedor de tema e o hook
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { MonthProvider } from "@/context/MonthContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Criamos um componente interno para acessar o contexto do tema
function RootLayoutContent() {
  const { theme } = useTheme(); // Pega o tema ('light' ou 'dark') do nosso contexto

  return (
    <NavigationProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
    </NavigationProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* 2. O ThemeProvider envolve tudo para que possamos usar o useTheme() dentro */}
      <ThemeProvider>
        <MonthProvider>
          <RootLayoutContent />
        </MonthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
