import React from "react";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/theme";
import { Home, PieChart } from "lucide-react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.secondary,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: 65,
          paddingBottom: 10,
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
    </Tabs>
  );
}
