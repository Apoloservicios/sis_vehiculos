import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function HomeScreen({ navigation }) {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BIENVENIDO</Text>
      <Text style={styles.subTitle}>{user?.email}</Text>
      <Text style={styles.subTitle}>Aeropuerto: {user?.airport}</Text>

      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: "#7ED957" }]}
        onPress={() => navigation.navigate("Recorridos")}
      >
        <MaterialCommunityIcons name="car" size={24} color="#fff" />
        <Text style={styles.menuText}>Ir a Recorridos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: "#34C6DA" }]}
        onPress={() => navigation.navigate("Administrar Vehículos")}
      >
        <MaterialCommunityIcons name="menu" size={24} color="#fff" />
        <Text style={styles.menuText}>Admin Vehículos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  subTitle: { fontSize: 16, marginBottom: 10 },
  menuButton: {
    flexDirection: "row",
    borderRadius: 24,
    padding: 15,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    width: "70%",
  },
  menuText: { fontSize: 16, color: "#fff", marginLeft: 10 },
});
