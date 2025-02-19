import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, TextInput, Button, ActivityIndicator, HelperText, Menu } from "react-native-paper";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { collection, doc, setDoc } from "firebase/firestore";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Register">;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const AIRPORTS = ["AFA", "LGS", "MDZ", "UAQ"]; // Lista de aeropuertos

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [airport, setAirport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuVisible, setMenuVisible] = useState(false); // Estado para mostrar menú

  const handleRegister = async () => {
    setLoading(true);
    setError("");

    if (!airport) {
      setError("Selecciona un aeropuerto.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guardar usuario en Firestore
      await setDoc(doc(collection(db, "usuarios"), user.uid), {
        uid: user.uid,
        email: email,
        airport: airport,
        role: "admin", // Por defecto admin hasta que otro admin lo cambie
      });

      navigation.replace("Home"); // Llevar al usuario a Home después de registrarse
    } catch (error) {
      setError("No se pudo crear la cuenta. Verifica los datos.");
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>

      <TextInput
        label="Correo Electrónico"
        mode="outlined"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        left={<TextInput.Icon icon="email" />}
      />

      <TextInput
        label="Contraseña"
        mode="outlined"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        left={<TextInput.Icon icon="lock" />}
      />

      {/* Selector de aeropuerto */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Button mode="outlined" onPress={() => setMenuVisible(true)} style={styles.input}>
            {airport ? `Aeropuerto: ${airport}` : "Selecciona tu aeropuerto"}
          </Button>
        }
      >
        {AIRPORTS.map((airportOption) => (
          <Menu.Item key={airportOption} onPress={() => { setAirport(airportOption); setMenuVisible(false); }} title={airportOption} />
        ))}
      </Menu>
      {error && <HelperText type="error">{error}</HelperText>}

      {loading ? (
        <ActivityIndicator animating={true} size="large" />
      ) : (
        <Button mode="contained" onPress={handleRegister} style={styles.button}>
          Registrarse
        </Button>
      )}

      <Button mode="text" onPress={() => navigation.navigate("Login")}>
        ¿Ya tienes cuenta? Inicia sesión
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f4f4f4",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    width: "100%",
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
});

export default RegisterScreen;
