// src/screens/RegisterScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ImageBackground,
  TouchableOpacity,
  Image,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/authSlice";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/types";
import { Picker } from "@react-native-picker/picker";

type Props = DrawerScreenProps<DrawerParamList, "Register">;

const airports = ["AFA", "MDZ","BRC","AEP","CRD","COR","EPA","EQS","EZE","FMA","GPO","IRJ","LGS","MDQ","PRA","JUJ","PSS","IGR","PRQ","RCQ","RES","RCU","RGL","RGA","SLA","FDO","CTC","UAQ","LUQ","TUC","RSA","SDE","RHD","VDM","VME"];
const roles = ["user", "admin"];

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [airport, setAirport] = useState(airports[0]);
  const [role, setRole] = useState<"user" | "admin">("user");

  const dispatch = useDispatch();

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Ingresa correo y contraseña");
      return;
    }
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Guardar en Firestore (colección "usuarios") usando UID como ID de documento
      await setDoc(doc(db, "usuarios", newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        airport: airport,
        role: role,
      });

      // Guardar en Redux
      dispatch(
        setUser({
          uid: newUser.uid,
          email: newUser.email,
          airport: airport,
          role: role,
        })
      );

      // NOTA: No navegamos manualmente a "Inicio".
      // El Drawer se re-renderizará con la ruta "Inicio" al detectarse que user != null.
    } catch (error: any) {
      console.log("Error al registrar usuario:", error);
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Error", "Este correo ya está en uso");
      } else {
        Alert.alert("Error", "No se pudo crear la cuenta");
      }
    }
  };

  return (
    <ImageBackground source={require("../../assets/bg_aeropuerto.png")} style={styles.bg}>
      <View style={styles.overlay}>
        <View style={styles.logoContainer}>
          <Image source={require("../../assets/logoblancoT.png")} style={styles.logo} />
        </View>

        <View style={styles.form}>
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
          <View style={styles.pickerContainer}>
            <Picker selectedValue={airport} onValueChange={(val) => setAirport(val)}>
              {airports.map((ap) => (
                <Picker.Item key={ap} label={ap} value={ap} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Rol:</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={role} onValueChange={(val) => setRole(val)}>
              {roles.map((r) => (
                <Picker.Item key={r} label={r.toUpperCase()} value={r} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Registrarme</Text>
          </TouchableOpacity>

          <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
            ¿Ya tienes cuenta? Inicia sesión
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
  logo: { width: 175, height: 175, resizeMode: "contain" },
  form: {
    backgroundColor: "#ffffffcc",
    margin: 20,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
    padding: 8,
    borderRadius: 4,
  },
  label: { marginVertical: 10, fontWeight: "bold" },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  registerButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  registerButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  link: { marginTop: 15, textAlign: "center", color: "blue" },
});
