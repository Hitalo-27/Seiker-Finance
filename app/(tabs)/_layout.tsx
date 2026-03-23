import React from "react";
import { Tabs } from "expo-router";
import { Colors } from "@/constants/theme";
import { Home, PieChart, User } from "lucide-react-native";
import { MonthProvider } from "../../context/MonthContext";
import { useTheme } from "@/context/ThemeContext";
import GlobalHeader from "@/components/Header";
import { StyleSheet, Image } from "react-native";
import { auth } from "@/FirebaseConfig";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { theme: themeMode } = useTheme();
  const theme = Colors[themeMode as keyof typeof Colors];
  const user = auth.currentUser;
  const insets = useSafeAreaInsets();

  return (
    <MonthProvider>
      <GlobalHeader />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.secondary,
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            height: 65 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
            paddingTop: 5,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Gráficos",
            tabBarIcon: ({ color }) => <PieChart size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color }) => {
              return user?.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  style={[
                    styles.headerAvatar,
                    {
                      borderColor:
                        color === theme.primary
                          ? theme.primary
                          : "rgba(255,255,255,0.2)",
                    },
                  ]}
                />
              ) : (
                <User size={24} color={color} />
              );
            },
          }}
        />
      </Tabs>
    </MonthProvider>
  );
}

const styles = StyleSheet.create({
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
});
