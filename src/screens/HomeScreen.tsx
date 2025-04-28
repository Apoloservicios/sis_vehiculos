// src/screens/HomeScreen.tsx (modificado)
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

      {/* Registrar Recorrido Manual */}
      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: "#007AFF" }]}
        onPress={() => navigation.navigate("Registrar Recorrido")}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        <Text style={styles.menuText}>Registrar Recorrido Manual</Text>
      </TouchableOpacity>
      
      {/* Nuevo: Recorrido GPS */}
      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: "#FF9800" }]}
        onPress={() => navigation.navigate("Recorrido GPS")}
      >
        <MaterialCommunityIcons name="map-marker-path" size={24} color="#fff" />
        <Text style={styles.menuText}>Registrar Recorrido GPS</Text>
      </TouchableOpacity>

      {/* Reportes Recorridos */}
      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: "#34C6DA" }]}
        onPress={() => navigation.navigate("Reportes Recorridos")}
      >
        <MaterialCommunityIcons name="file-excel" size={24} color="#fff" />
        <Text style={styles.menuText}>Reportes Recorridos</Text>
      </TouchableOpacity>

      {/* Solo Admin ve estas opciones */}
      {user.role === "admin" && (
        <>
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: "#f0ad4e" }]}
            onPress={() => navigation.navigate("Administrar Vehículos")}
          >
            <MaterialCommunityIcons name="car-cog" size={24} color="#fff" />
            <Text style={styles.menuText}>Administrar Vehículos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: "#9C27B0" }]}
            onPress={() => navigation.navigate("Gestión de Observaciones")}
          >
            <MaterialCommunityIcons name="format-list-checkbox" size={24} color="#fff" />
            <Text style={styles.menuText}>Gestionar Observaciones</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: "#FF5722" }]}
            onPress={() => navigation.navigate("Gestión de Usuarios")}
          >
            <MaterialCommunityIcons name="account-group" size={24} color="#fff" />
            <Text style={styles.menuText}>Gestionar Usuarios</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  subTitle: { fontSize: 16, marginBottom: 10 },
  menuButton: {
    flexDirection: "row",
    borderRadius: 24,
    padding: 15,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  menuText: { fontSize: 16, color: "#fff", marginLeft: 10, fontWeight: "500" },
});