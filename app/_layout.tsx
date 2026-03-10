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

import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { MonthProvider } from "@/context/MonthContext";
import { AlertProvider, useAlert } from "@/context/AlertContext";
import ThemedAlert from "../components/ThemedAlert";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutContent() {
  const { theme } = useTheme();
  const { alertConfig, hideAlert } = useAlert();

  return (
    <NavigationProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

      <ThemedAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
      />

      <StatusBar style={theme === "dark" ? "light" : "dark"} />
    </NavigationProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AlertProvider>
          <MonthProvider>
            <RootLayoutContent />
          </MonthProvider>
        </AlertProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
