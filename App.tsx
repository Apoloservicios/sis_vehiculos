import React from "react";
import { Provider } from "react-redux";
import { PaperProvider, DefaultTheme } from "react-native-paper";
import {store} from "./src/redux/store";
import AppNavigator from "./src/navigation/AppNavigator";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#007AFF", // Color principal azul
    accent: "#FF3B30",  // Color de acento rojo
  },
};

export default function App() {
  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <AppNavigator />
      </PaperProvider>
    </Provider>
  );
}
