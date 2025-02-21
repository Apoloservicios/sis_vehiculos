// src/theme.ts
import { MD3LightTheme as DefaultTheme } from "react-native-paper";

export const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#007AFF",         // Azul para botones, etc.
    secondary: "#34C6DA",       // Celeste
    tertiary: "#7ED957",        // Verde
    background: "#F4F6F9",      // Fondo gris claro
    surface: "#FFFFFF",
    onSurface: "#333333",
    // Ajusta según necesites
  },
};
