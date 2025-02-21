// src/screens/SplashScreen.tsx
import React, { useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";

import { DrawerScreenProps } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/types";


export default function SplashScreen({navigation}) {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace("Login"); 
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/splash.png")} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#008B8B", alignItems: "center", justifyContent: "center" },
  logo: { width: 200, height: 200, resizeMode: "contain" },
});
