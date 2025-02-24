// src/screens/HomeScreen.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/types";

type Props = DrawerScreenProps<DrawerParamList, "Inicio">;

export default function HomeScreen({ navigation }: Props) {
  const user = useSelector((state: RootState) => state.auth);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BIENVENIDO</Text>
      <Text style={styles.subTitle}>{user.email}</Text>
      <Text style={styles.subTitle}>Aeropuerto: {user.airport}</Text>
      <Text style={styles.subTitle}>Rol: {user.role}</Text>

      {/* Botón: Ir a Recorridos */}
      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: "#7ED957" }]}
        onPress={() => navigation.navigate("Recorridos")}
      >
        <MaterialCommunityIcons name="car" size={24} color="#fff" />
        <Text style={styles.menuText}>Ir a Recorridos</Text>
      </TouchableOpacity>

      {/* Registrar Recorrido */}
      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: "#007AFF" }]}
        onPress={() => navigation.navigate("Registrar Recorrido")}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        <Text style={styles.menuText}>Registrar Recorrido</Text>
      </TouchableOpacity>

      {/* Reportes Recorridos */}
      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: "#34C6DA" }]}
        onPress={() => navigation.navigate("Reportes Recorridos")}
      >
        <MaterialCommunityIcons name="file-excel" size={24} color="#fff" />
        <Text style={styles.menuText}>Reportes Recorridos</Text>
      </TouchableOpacity>

      {/* Solo Admin ve "Administrar Vehículos" */}
      {user.role === "admin" && (
        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: "#f0ad4e" }]}
          onPress={() => navigation.navigate("Administrar Vehículos")}
        >
          <MaterialCommunityIcons name="menu" size={24} color="#fff" />
          <Text style={styles.menuText}>Administrar Vehículos</Text>
        </TouchableOpacity>
      )}
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
