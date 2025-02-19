import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, TextInput, Button, ActivityIndicator } from "react-native-paper";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, getDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/authSlice";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Obtener datos del usuario desde Firestore
      const userDoc = await getDoc(doc(db, "usuarios", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        dispatch(setUser({ uid: user.uid, email: user.email, airport: userData.airport }));
        navigation.replace("Home");
      } else {
        setError("Usuario no encontrado en la base de datos.");
      }
    } catch (error) {
      setError("Credenciales incorrectas.");
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>

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

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator animating={true} size="large" />
      ) : (
        <Button mode="contained" onPress={handleLogin} style={styles.button}>
          Ingresar
        </Button>
      )}

      <Button mode="text" onPress={() => navigation.navigate("Register")}>
        ¿No tienes cuenta? Regístrate
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

export default LoginScreen;
