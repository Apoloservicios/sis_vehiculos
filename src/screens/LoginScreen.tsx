// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ImageBackground,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/authSlice";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/types";

type Props = DrawerScreenProps<DrawerParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      // 1) Autenticar en Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userFb = userCredential.user;

      // 2) Leer doc en Firestore (colección "usuarios")
      const docRef = doc(db, "usuarios", userFb.uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const userData = snap.data();
        // 3) Guardar en Redux (incluyendo role)
        dispatch(
          setUser({
            uid: userData.uid || userFb.uid,
            email: userFb.email,
            airport: userData.airport || "",
            role: userData.role || "user",
          })
        );
        // NOTA: No navegamos manualmente a "Inicio". 
        // El AppNavigator se re-renderizará y mostrará el Drawer logueado con "Inicio" como inicial.
      } else {
        Alert.alert("Error", "No se encontró el usuario en la base de datos");
      }
    } catch (error) {
      console.log("Error login:", error);
      Alert.alert("Error", "Credenciales incorrectas");
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/bg_aeropuerto.png")}
      style={styles.bg}
    >
      <View style={styles.overlay}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/logoblancoT.png")}
            style={styles.logo}
          />
        </View>
        <View style={styles.form}>
          <Text style={styles.label}>Usuario</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <View style={{ marginTop: 20 }}>
            <Button title="Ingresar" onPress={handleLogin} color="#007AFF" />
          </View>
          <Text
            style={styles.register}
            onPress={() => navigation.navigate("Register")}
          >
            ¿No tienes cuenta? Regístrate
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: "100%", height: "100%" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)" },
  logoContainer: { alignItems: "center", marginTop: 60 },
  logo: {
    width: 175,
    height: 175,
    resizeMode: "contain",
  },
  form: {
    backgroundColor: "#ffffffcc",
    margin: 20,
    borderRadius: 12,
    padding: 20,
    marginTop: 100,
  },
  label: { fontWeight: "bold", marginTop: 10 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
    padding: 8,
    borderRadius: 4,
  },
  register: { marginTop: 15, textAlign: "center", color: "#007AFF" },
});
