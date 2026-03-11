export default {
  expo: {
    name: "seiker-finance",
    slug: "seiker-finance",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "seikerfinance",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hitalo_27.seikerfinance"
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#0B0E11",
        foregroundImage: "./assets/images/adaptive-icon.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.hitalo_27.seikerfinance",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json"
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#0B0E11",
          "dark": {
            "backgroundColor": "#0B0E11"
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "a79b86e0-98dc-4a99-9c02-6409077c46e1"
      }
    }
  }
};