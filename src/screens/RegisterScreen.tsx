// Modificación de src/screens/RegisterScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ImageBackground,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/authSlice";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = DrawerScreenProps<DrawerParamList, "Register">;

const airports = ["AFA", "MDZ", "BRC", "AEP", "CRD", "COR", "EPA", "EQS", "EZE", "FMA", "GPO", "IRJ", "LGS", "MDQ", "PRA", "JUJ", "PSS", "IGR", "PRQ", "RCQ", "RES", "RCU", "RGL", "RGA", "SLA", "FDO", "CTC", "UAQ", "LUQ", "TUC", "RSA", "SDE", "RHD", "VDM", "VME"];
const roles = ["admin", "user"];

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [airportSearch, setAirportSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [filteredAirports, setFilteredAirports] = useState<string[]>([]);
  const [showAirportList, setShowAirportList] = useState(false);
  const [role, setRole] = useState<"admin" | "user">("admin");
  const [showAirportModal, setShowAirportModal] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    if (airportSearch) {
      const filtered = airports.filter(airport => 
        airport.toLowerCase().includes(airportSearch.toLowerCase())
      );
      setFilteredAirports(filtered);
    } else {
      setFilteredAirports(airports);
    }
  }, [airportSearch]);

  const selectAirport = (airport: string) => {
    setAirportSearch(airport);
    setShowAirportModal(false);
  };


  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Por favor complete todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    if (!airports.includes(airportSearch)) {
      Alert.alert("Error", "Por favor seleccione un aeropuerto válido");
      return;
    }

    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Enviar email de verificación
      await sendEmailVerification(newUser);

      // Guardar en Firestore (colección "usuarios") usando UID como ID de documento
      await setDoc(doc(db, "usuarios", newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        airport: airportSearch,
        role: role,
        verified: false,
        createdAt: new Date().toISOString(),
      });

      // Guardar en Redux
      dispatch(
        setUser({
          uid: newUser.uid,
          email: newUser.email,
          airport: airportSearch,
          role: role,
        })
      );

      Alert.alert(
        "Registro exitoso", 
        "Se ha enviado un correo de verificación a tu dirección de email."
      );

    } catch (error: any) {
      console.log("Error al registrar usuario:", error);
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Error", "Este correo ya está en uso");
      } else if (error.code === "auth/weak-password") {
        Alert.alert("Error", "La contraseña es demasiado débil");
      } else {
        Alert.alert("Error", "No se pudo crear la cuenta");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ImageBackground source={require("../../assets/bg_aeropuerto.png")} style={styles.bg}>
        <View style={styles.overlay}>
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoContainer}>
              <Image source={require("../../assets/logoblancoT.png")} style={styles.logo} />
            </View>

            <View style={styles.form}>
              <Text style={styles.title}>Registro</Text>

              <Text style={styles.label}>Correo Electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingrese su correo"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Ingrese su contraseña"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
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
              
              <Text style={styles.label}>Confirmar Contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirme su contraseña"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#007AFF"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Aeropuerto:</Text>
              <TouchableOpacity 
                style={styles.input}
                onPress={() => setShowAirportModal(true)}
              >
                <Text>{airportSearch || "Seleccionar aeropuerto"}</Text>
              </TouchableOpacity>
              
              {showAirportList && (
                <View style={styles.autocompleteContainer}>
                  <FlatList
                    data={filteredAirports}
                    keyExtractor={(item) => item}
                    keyboardShouldPersistTaps="always"
                    nestedScrollEnabled={true}
                    style={{ maxHeight: 150 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.autocompleteItem}
                        onPress={() => selectAirport(item)}
                      >
                        <Text>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}

              <Text style={styles.label}>Rol:</Text>
              <View style={styles.roleContainer}>
                {roles.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleButton,
                      role === r && styles.roleButtonSelected
                    ]}
                    onPress={() => setRole(r as "user" | "admin")}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      role === r && styles.roleButtonTextSelected
                    ]}>
                      {r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
                <Text style={styles.registerButtonText}>Registrarme</Text>
              </TouchableOpacity>

              <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
                ¿Ya tienes cuenta? Inicia sesión
              </Text>
            </View>
          </ScrollView>
          {/* Modal para seleccionar aeropuerto */}
          <Modal
            visible={showAirportModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowAirportModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Seleccionar Aeropuerto</Text>
                
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar aeropuerto"
                  value={airportSearch}
                  onChangeText={setAirportSearch}
                  autoFocus
                />
                
                <FlatList
                  data={filteredAirports}
                  keyExtractor={(item) => item}
                  style={styles.airportList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.airportItem}
                      onPress={() => selectAirport(item)}
                    >
                      <Text>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
                
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowAirportModal(false)}
                >
                  <Text style={styles.closeButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  bg: { flex: 1, width: "100%", height: "100%" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)" },
  logoContainer: { alignItems: "center", marginTop: 20 },
  logo: { width: 120, height: 120, resizeMode: "contain" },
  form: {
    backgroundColor: "#ffffffcc",
    margin: 20,
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
  },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 15 },
  label: { marginVertical: 5, fontWeight: "bold" },
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
  autocompleteContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginBottom: 12,
    maxHeight: 150,
  },
  autocompleteItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  roleButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: "center",
  },
  roleButtonSelected: {
    backgroundColor: "#007AFF",
  },
  roleButtonText: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  roleButtonTextSelected: {
    color: "#fff",
  },
  registerButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  registerButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  link: { marginTop: 15, textAlign: "center", color: "#007AFF" },


  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    width: "80%",
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  airportList: {
    maxHeight: 300,
  },
  airportItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  closeButtonText: {
    fontWeight: "bold",
  },
});
