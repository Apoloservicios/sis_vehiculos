import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/authSlice";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/types";

type Props = DrawerScreenProps<DrawerParamList, "Register">;

const airports = ["AFA", "LGS", "MDZ", "UAQ"];

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [airport, setAirport] = useState("");
  const dispatch = useDispatch();

  const handleRegister = async () => {
    if (!airport) {
      Alert.alert("Error", "Selecciona un aeropuerto");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      dispatch(setUser({ uid: newUser.uid, email: newUser.email, airport }));
      navigation.navigate("Inicio");
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la cuenta");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.label}>Selecciona Aeropuerto:</Text>
      {airports.map((ap) => (
        <Button
          key={ap}
          title={ap === airport ? `[X] ${ap}` : ap}
          onPress={() => setAirport(ap)}
          color={ap === airport ? "green" : "gray"}
        />
      ))}

      <Button title="Registrarme" onPress={handleRegister} />
      <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
        ¿Ya tienes cuenta? Inicia sesión
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 12, padding: 8, borderRadius: 4 },
  label: { marginVertical: 10 },
  link: { marginTop: 15, textAlign: "center", color: "blue" },
});
