// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, ImageBackground, StyleSheet, Alert } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/authSlice";
import { doc, getDoc } from "firebase/firestore";
import { Image } from "react-native";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userFb = userCredential.user;
      // Leer airport en Firestore
      const docRef = doc(db, "usuarios", userFb.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const userData = snap.data();
        dispatch(setUser({
          uid: userFb.uid,
          email: userFb.email,
          airport: userData.airport || "",
        }));
        navigation.navigate("Inicio");
      } else {
        Alert.alert("Error", "No se encontró el usuario en la base de datos");
      }
    } catch (error) {
      Alert.alert("Error", "Credenciales incorrectas");
    }
  };

  return (
    <ImageBackground source={require("../../assets/bg_aeropuerto.png")} style={styles.bg}>
      <View style={styles.overlay}>
        <View style={styles.logoContainer}>
        <Image 
                    source={require('../../assets/logoblancoT.png')}
                    style={styles.logo} 
                />
        </View>
        <View style={styles.form}>
          <Text style={styles.label}>Usuario</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} />
          <Text style={styles.label}>Contraseña</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
          <View style={{ marginTop: 20 }}>
            <Button title="Ingresar" onPress={handleLogin} color="#007AFF" />
          </View>
          <Text style={styles.register} onPress={() => navigation.navigate("Register")}>
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
  logo: {  width: 175,  // Ancho deseado del contenedor de la imagen
    height: 175, // Alto deseado del contenedor de la imagen
    resizeMode: 'contain' },
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
