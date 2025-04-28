// src/screens/LoginScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ImageBackground,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/authSlice";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = DrawerScreenProps<DrawerParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const dispatch = useDispatch();

  // Detectar cuando el teclado se muestra/oculta
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingrese usuario y contraseña");
      return;
    }
    
    try {
      // 1) Autenticar en Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userFb = userCredential.user;

      // Verificar si el email está verificado
      if (!userFb.emailVerified) {
        Alert.alert(
          "Email no verificado",
          "Tu correo electrónico no ha sido verificado. ¿Deseas reenviar el enlace de verificación?",
          [
            {
              text: "Cancelar",
              style: "cancel"
            },
            {
              text: "Reenviar email",
              onPress: async () => {
                try {
                  await sendEmailVerification(userFb);
                  Alert.alert("Email enviado", "Se ha enviado un enlace de verificación a tu correo.");
                } catch (error) {
                  console.error("Error al enviar email:", error);
                  Alert.alert("Error", "No se pudo enviar el email de verificación");
                }
              }
            },
            {
              text: "Continuar de todos modos",
              onPress: async () => fetchUserData(userFb)
            }
          ]
        );
        return;
      }

      await fetchUserData(userFb);
    } catch (error) {
      console.log("Error login:", error);
      Alert.alert("Error", "Credenciales incorrectas");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Por favor ingrese su correo electrónico primero");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Email enviado", 
        "Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico."
      );
    } catch (error) {
      console.error("Error al enviar email de recuperación:", error);
      Alert.alert("Error", "No se pudo enviar el correo de recuperación de contraseña");
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      Alert.alert("Error", "Por favor ingrese su correo electrónico primero");
      return;
    }

    try {
      // Intentar iniciar sesión para obtener el usuario
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      Alert.alert("Email enviado", "Se ha enviado un nuevo enlace de verificación a tu correo.");
    } catch (error) {
      console.error("Error al reenviar verificación:", error);
      Alert.alert("Error", "No se pudo reenviar el email de verificación. Verifica tus credenciales.");
    }
  };

  const fetchUserData = async (userFb: any) => {
    try {
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
      } else {
        Alert.alert("Error", "No se encontró el usuario en la base de datos");
      }
    } catch (error) {
      console.error("Error al obtener datos:", error);
      Alert.alert("Error", "No se pudieron recuperar los datos del usuario");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ImageBackground
        source={require("../../assets/bg_aeropuerto.png")}
        style={styles.bg}
      >
        <View style={styles.overlay}>
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.logoContainer, keyboardVisible && styles.logoSmallContainer]}>
              <Image
                source={require("../../assets/logoblancoT.png")}
                style={keyboardVisible ? styles.logoSmall : styles.logo}
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
                returnKeyType="next"
                placeholder="Ingrese su correo electrónico"
              />
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  placeholder="Ingrese su contraseña"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#007AFF"
                  />
                </TouchableOpacity>
              </View>
              
              {/* Opción de recuperar contraseña */}
              <TouchableOpacity
                onPress={handleForgotPassword}
                style={styles.forgotPasswordLink}
              >
                <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>Ingresar</Text>
              </TouchableOpacity>
              
              {/* Opción de reenviar correo de verificación */}
              <TouchableOpacity
                onPress={handleResendVerification}
                style={styles.verificationLink}
              >
                <Text style={styles.linkText}>Reenviar correo de verificación</Text>
              </TouchableOpacity>
              
              <Text
                style={styles.register}
                onPress={() => navigation.navigate("Register")}
              >
                ¿No tienes cuenta? Regístrate
              </Text>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: "100%", height: "100%" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)" },
  logoContainer: { 
    alignItems: "center", 
    marginTop: 40,
    width: '100%',
    justifyContent: "center" 
  },
  logoSmallContainer: {
    alignItems: "center", 
    marginTop: 10,
    width: '100%',
    justifyContent: "center"
  },
  logo: {
    width: 175,
    height: 175,
    resizeMode: "contain",
  },
  logoSmall: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  form: {
    backgroundColor: "#ffffffcc",
    margin: 20,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  label: { fontWeight: "bold", marginTop: 10 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
    padding: 10,
    borderRadius: 6,
  },
  passwordContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
    borderRadius: 6,
  },
  passwordInput: {
    flex: 1,
    padding: 10,
  },
  eyeIcon: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  verificationLink: {
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  linkText: {
    color: "#007AFF",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  register: { 
    marginTop: 10, 
    textAlign: "center", 
    color: "#007AFF"
  },});